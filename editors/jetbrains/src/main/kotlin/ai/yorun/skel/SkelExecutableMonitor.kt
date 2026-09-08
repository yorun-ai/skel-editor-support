package ai.yorun.skel

import com.intellij.ide.trustedProjects.TrustedProjects
import com.intellij.notification.NotificationAction
import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.Disposable
import com.intellij.openapi.application.ApplicationActivationListener
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.LocalFileSystem
import com.intellij.openapi.vfs.VirtualFileManager
import com.intellij.openapi.vfs.newvfs.BulkFileListener
import com.intellij.openapi.vfs.newvfs.events.VFileEvent
import com.intellij.openapi.wm.IdeFrame
import com.intellij.platform.lsp.api.LspServerManager
import com.intellij.util.Alarm
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.attribute.BasicFileAttributes

internal data class SkelExecutableStamp(val paths: List<Path>, val identity: String)

internal fun executableStamp(command: String, directory: String?, environment: Map<String, String>): SkelExecutableStamp? {
    val path = Path.of(command)
    val base = Path.of(directory ?: System.getProperty("user.dir"))
    val candidates = if (path.isAbsolute || path.parent != null) listOf(base.resolve(path).normalize()) else {
        val extensions = if (System.getProperty("os.name").startsWith("Windows") && !command.contains('.'))
            (environment["PATHEXT"] ?: ".EXE;.CMD;.BAT;.COM").split(';') else listOf("")
        (environment["PATH"] ?: environment["Path"] ?: "").split(java.io.File.pathSeparatorChar).flatMap { entry ->
            extensions.map { base.resolve(entry).resolve(command + it).normalize() }
        }
    }
    for (candidate in candidates) try {
        if (!Files.isExecutable(candidate)) continue
        val real = candidate.toRealPath()
        val attributes = Files.readAttributes(real, BasicFileAttributes::class.java)
        if (!attributes.isRegularFile) continue
        return SkelExecutableStamp(listOf(candidate, real).distinct(),
            "$candidate|$real|${attributes.fileKey()}|${attributes.size()}|${attributes.lastModifiedTime()}|${attributes.creationTime()}")
    } catch (_: java.io.IOException) { /* An installation can temporarily remove the file. */ }
    return null
}

@Service(Service.Level.PROJECT)
internal class SkelExecutableMonitor(private val project: Project) : Disposable {
    private val alarm = Alarm(Alarm.ThreadToUse.POOLED_THREAD, this)
    private var generation = 0
    private var command: String? = null
    private var baseline: String? = null
    private var paths = emptyList<Path>()
    private var roots = emptySet<LocalFileSystem.WatchRequest>()
    private val seen = mutableSetOf<String>()
    private var notification: com.intellij.notification.Notification? = null

    init {
        val connection = ApplicationManager.getApplication().messageBus.connect(this)
        connection.subscribe(VirtualFileManager.VFS_CHANGES, object : BulkFileListener {
            override fun after(events: List<VFileEvent>) {
                val watched = synchronized(this@SkelExecutableMonitor) { paths.map { it.toString().replace('\\', '/') } }
                if (events.any { event -> watched.any { it == event.path || it.startsWith(event.path + "/") } }) check()
            }
        })
        connection.subscribe(ApplicationActivationListener.TOPIC, object : ApplicationActivationListener {
            override fun applicationActivated(ideFrame: IdeFrame) { check() }
        })
    }

    @Synchronized fun start(executable: String, stamp: SkelExecutableStamp?) {
        stop()
        command = executable
        baseline = stamp?.identity
        bind(stamp)
        check()
    }

    @Synchronized fun stop() {
        generation++
        command = null
        alarm.cancelAllRequests()
        LocalFileSystem.getInstance().removeWatchedRoots(roots)
        roots = emptySet()
        paths = emptyList()
        seen.clear()
        notification?.expire()
        notification = null
    }

    private fun stamp(executable: String) = executableStamp(executable, project.basePath,
        SkelServerCommand.command(executable, "lsp", project.basePath).effectiveEnvironment)

    @Synchronized private fun bind(state: SkelExecutableStamp?) {
        if (state == null || state.paths == paths) return
        val fs = LocalFileSystem.getInstance()
        fs.removeWatchedRoots(roots)
        paths = state.paths
        roots = fs.addRootsToWatch(paths.map { it.parent.toString() }.distinct(), false)
        // Materialize watched files in VFS so external changes produce VFS events.
        val files = paths
        ApplicationManager.getApplication().executeOnPooledThread {
            if (!project.isDisposed) files.forEach { fs.refreshAndFindFileByNioFile(it) }
        }
    }

    @Synchronized fun check() {
        val executable = command ?: return
        if (!project.getService(SkelSettings::class.java).state.enabled || !TrustedProjects.isProjectTrusted(project)) {
            stop()
            return
        }
        val token = generation
        alarm.cancelAllRequests()
        alarm.addRequest({ inspect(executable, token) }, 2000)
    }

    private fun inspect(executable: String, token: Int) {
        val state = stamp(executable) ?: return
        synchronized(this) {
            if (token != generation || project.isDisposed || !TrustedProjects.isProjectTrusted(project)) return
            bind(state)
            if (state.identity == baseline || state.identity in seen) return
        }
        // Verify only after a second, stable observation; never stop the old server here.
        alarm.addRequest({ confirm(executable, token, state) }, 2000)
    }

    private fun confirm(executable: String, token: Int, state: SkelExecutableStamp) {
        synchronized(this) { if (token != generation || project.isDisposed || !TrustedProjects.isProjectTrusted(project)) return }
        if (stamp(executable) != state) { check(); return }
        try { SkelServerCommand.verified(executable, project.basePath) }
        catch (_: com.intellij.execution.ExecutionException) { return }
        if (stamp(executable) != state) { check(); return }
        ApplicationManager.getApplication().invokeLater {
            synchronized(this) {
                if (token != generation || project.isDisposed || !seen.add(state.identity)) return@invokeLater
                notification?.expire()
                notification = NotificationGroupManager.getInstance().getNotificationGroup("Skel Updates")
                    .createNotification("skelc has been updated", "Restart the language server to use the updated executable.", NotificationType.INFORMATION)
                    .addAction(NotificationAction.createSimpleExpiring("Restart Now") {
                        ApplicationManager.getApplication().executeOnPooledThread {
                            if (stamp(executable) == state) ApplicationManager.getApplication().invokeLater {
                                synchronized(this) {
                                    if (token == generation && !project.isDisposed && TrustedProjects.isProjectTrusted(project)) {
                                        LspServerManager.getInstance(project).stopAndRestartIfNeeded(SkelLspServerSupportProvider::class.java)
                                    }
                                }
                            } else check()
                        }
                    })
                    .addAction(NotificationAction.createSimpleExpiring("Later") {})
                notification?.notify(project)
            }
        }
    }

    override fun dispose() { stop() }
}
