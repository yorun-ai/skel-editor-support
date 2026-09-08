package ai.yorun.skel

import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.vfs.newvfs.impl.VfsRootAccess
import com.intellij.openapi.vfs.LocalFileSystem
import com.intellij.platform.lsp.api.LspServerManager
import com.intellij.platform.lsp.api.LspServerState
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import com.intellij.util.ui.UIUtil
import java.nio.file.Files
import java.util.concurrent.TimeUnit

/** Verifies the registered JetBrains integration actually starts and restarts skelc. */
class SkelLspPlatformTest : BasePlatformTestCase() {
    fun testRegisteredClientLifecycle() {
        val executable = System.getProperty("skelc.path", "")
        if (executable.isBlank()) return // The real protocol test records the explicit skip.
        val settings = project.getService(SkelSettings::class.java)
        settings.loadState(SkelSettings.Options(executable = executable))
        // A light fixture's base directory may not exist until a physical file is added.
        val directory = java.nio.file.Path.of(project.basePath!!)
        Files.createDirectories(directory)
        VfsRootAccess.allowRootAccess(testRootDisposable, directory.toString(), directory.toRealPath().toString())
        val path = directory.resolve("client-lifecycle.skel")
        Files.writeString(path, "domain example\ndata Customer { id: uuid }\n")
        val file = LocalFileSystem.getInstance().refreshAndFindFileByNioFile(path)!!
        com.intellij.openapi.command.WriteCommandAction.runWriteCommandAction(project) {
            com.intellij.testFramework.PsiTestUtil.addContentRoot(module, file.parent)
        }
        assertTrue("Physical Skel file must be supported", SkelLspServerSupportProvider.supports(file))
        assertTrue("Fixture must be trusted", com.intellij.ide.trustedProjects.TrustedProjects.isProjectTrusted(project))
        val manager = LspServerManager.getInstance(project)
        val provider = SkelLspServerSupportProvider::class.java
        try {
            FileEditorManager.getInstance(project).openFile(file, false)
            manager.startServersIfNeeded(provider)
            await("registered client initialization") {
                manager.getServersForProvider(provider).any { it.state == LspServerState.Running }
            }
            val initial = manager.getServersForProvider(provider).first { it.state == LspServerState.Running }
            assertEquals("skel", initial.descriptor.getLanguageId(file))
            assertNotNull(initial.initializeResult?.capabilities?.completionProvider)
            manager.stopAndRestartIfNeeded(provider)
            await("client restart") {
                manager.getServersForProvider(provider).any { it !== initial && it.state == LspServerState.Running }
            }
            settings.state.enabled = false
            manager.stopAndRestartIfNeeded(provider)
            await("disabled client stops") { manager.getServersForProvider(provider).none { it.state == LspServerState.Running } }
        } finally {
            settings.state.enabled = false
            manager.stopServers(provider)
            FileEditorManager.getInstance(project).closeFile(file)
        }
    }

    fun testExecutableUpdateNotification() {
        val installed = System.getProperty("skelc.path", "")
        if (installed.isBlank()) return
        Files.createDirectories(java.nio.file.Path.of(project.basePath!!))
        project.getService(SkelSettings::class.java).loadState(SkelSettings.Options())
        val directory = Files.createTempDirectory("skel-update-notification-")
        VfsRootAccess.allowRootAccess(testRootDisposable, directory.toString(), directory.toRealPath().toString())
        val executable = directory.resolve("skelc")
        Files.copy(java.nio.file.Path.of(installed), executable)
        executable.toFile().setExecutable(true)
        val notices = mutableListOf<com.intellij.notification.Notification>()
        project.messageBus.connect(testRootDisposable).subscribe(com.intellij.notification.Notifications.TOPIC,
            object : com.intellij.notification.Notifications {
                override fun notify(notification: com.intellij.notification.Notification) {
                    if (notification.groupId == "Skel Updates") notices.add(notification)
                }
            })
        val monitor = project.getService(SkelExecutableMonitor::class.java)
        try {
            monitor.start(executable.toString(), executableStamp(executable.toString(), null, emptyMap()))
            Files.setLastModifiedTime(executable, java.nio.file.attribute.FileTime.fromMillis(System.currentTimeMillis() + 10000))
            monitor.check() // The same entry point used when the IDE regains focus.
            await("update notification") { notices.size == 1 }
            assertEquals(listOf("Restart Now", "Later"), notices.single().actions.map { it.templatePresentation.text })
            notices.single().expire()
            monitor.check()
            val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5)
            while (System.nanoTime() < deadline) {
                UIUtil.dispatchAllInvocationEvents()
                Thread.sleep(10)
            }
            assertEquals("An ignored update must not prompt again", 1, notices.size)
        } finally {
            monitor.stop()
            directory.toFile().deleteRecursively()
        }
    }

    private fun await(description: String, condition: () -> Boolean) {
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(20)
        while (!condition() && System.nanoTime() < deadline) {
            UIUtil.dispatchAllInvocationEvents()
            Thread.sleep(10)
        }
        assertTrue("Timed out waiting for $description", condition())
    }
}
