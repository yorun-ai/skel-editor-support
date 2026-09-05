package ai.yorun.skel

import com.intellij.execution.ExecutionException
import com.intellij.ide.trustedProjects.TrustedProjects
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.project.DumbAwareAction
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.platform.lsp.api.LspServer
import com.intellij.platform.lsp.api.LspServerManager
import com.intellij.platform.lsp.api.LspServerSupportProvider
import com.intellij.platform.lsp.api.ProjectWideLspServerDescriptor
import com.intellij.platform.lsp.api.lsWidget.LspServerWidgetItem
import org.eclipse.lsp4j.ConfigurationItem

class SkelLspServerSupportProvider : LspServerSupportProvider {
    override fun fileOpened(project: Project, file: VirtualFile, serverStarter: LspServerSupportProvider.LspServerStarter) {
        if (supports(file) && TrustedProjects.isProjectTrusted(project) && project.getService(SkelSettings::class.java).state.enabled) {
            serverStarter.ensureServerStarted(SkelLspServerDescriptor(project))
        }
    }
    override fun createLspServerWidgetItem(lspServer: LspServer, currentFile: VirtualFile?) =
        LspServerWidgetItem(lspServer, currentFile, SkelIcons.FILE, SkelConfigurable::class.java)

    companion object {
        fun supports(file: VirtualFile) = file.isInLocalFileSystem && !file.isDirectory && file.extension == "skel"
    }
}

class SkelLspServerDescriptor(project: Project) : ProjectWideLspServerDescriptor(project, "Skel") {
    private val options = project.getService(SkelSettings::class.java).state.copy()
    override fun isSupportedFile(file: VirtualFile) = SkelLspServerSupportProvider.supports(file)
    override fun getLanguageId(file: VirtualFile) = "skel"
    override fun createCommandLine() = if (TrustedProjects.isProjectTrusted(project) && options.enabled) {
        SkelServerCommand.verified(options.executable, project.basePath)
    } else {
        throw ExecutionException("Skel language server is disabled or the project is not trusted.")
    }
    override fun createInitializationOptions(): Any = mapOf("schemaCompatibility" to options.compatibilityOptions())
    override fun getWorkspaceConfiguration(item: ConfigurationItem): Any? = when (item.section) {
        "schemaCompatibility", "skelc.schemaCompatibility" -> options.compatibilityOptions()
        null, "", "skelc" -> createInitializationOptions()
        else -> null
    }
}

class SkelRestartAction : DumbAwareAction() {
    override fun getActionUpdateThread() = ActionUpdateThread.BGT
    override fun update(event: AnActionEvent) {
        event.presentation.isEnabled = event.project?.let {
            TrustedProjects.isProjectTrusted(it) && it.getService(SkelSettings::class.java).state.enabled
        } ?: false
    }
    override fun actionPerformed(event: AnActionEvent) {
        val project = event.project ?: return
        LspServerManager.getInstance(project).stopAndRestartIfNeeded(SkelLspServerSupportProvider::class.java)
    }
}
