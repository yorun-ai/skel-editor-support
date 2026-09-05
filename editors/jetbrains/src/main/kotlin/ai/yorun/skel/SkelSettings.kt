package ai.yorun.skel

import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage
import com.intellij.openapi.components.StoragePathMacros
import com.intellij.openapi.options.Configurable
import com.intellij.openapi.project.Project
import com.intellij.platform.lsp.api.LspServerManager
import com.intellij.ui.components.JBCheckBox
import com.intellij.ui.components.JBTextField
import com.intellij.util.ui.FormBuilder
import javax.swing.JComponent
import javax.swing.JLabel
import javax.swing.JPanel

@Service(Service.Level.PROJECT)
@State(name = "SkelSettings", storages = [Storage(StoragePathMacros.WORKSPACE_FILE)])
class SkelSettings : PersistentStateComponent<SkelSettings.Options> {
    data class Options(
        var executable: String = "skelc",
        var enabled: Boolean = true,
        var compatibilityDiagnostics: Boolean = true,
        var includeCompatible: Boolean = false,
        var baseline: String = ""
    ) {
        fun compatibilityOptions(): Map<String, Any> = mapOf(
            "diagnostics" to compatibilityDiagnostics,
            "includeCompatible" to includeCompatible,
            // The VS Code schema report command UI is not provided by this client.
            "codeLens" to false,
            "baseline" to baseline.trim()
        )
    }
    private var options = Options()
    override fun getState() = options
    override fun loadState(state: Options) { options = state }
}

class SkelConfigurable(private val project: Project) : Configurable {
    private var panel: JPanel? = null
    private var executable: JBTextField? = null
    private var enabled: JBCheckBox? = null
    private var diagnostics: JBCheckBox? = null
    private var compatible: JBCheckBox? = null
    private var baseline: JBTextField? = null
    private val settings get() = project.getService(SkelSettings::class.java)

    override fun getDisplayName() = "Skel"
    override fun createComponent(): JComponent {
        executable = JBTextField()
        enabled = JBCheckBox("Enable skelc language server")
        diagnostics = JBCheckBox("Report schema compatibility changes")
        compatible = JBCheckBox("Include compatible changes as hints")
        baseline = JBTextField()
        panel = FormBuilder.createFormBuilder()
            .addComponent(enabled!!)
            .addLabeledComponent("skelc executable:", executable!!)
            .addComponent(JLabel("Use skelc from PATH or an absolute executable path (no arguments)."))
            .addComponent(JLabel("Requires ${SkelVocabulary.minimumVersion} or newer. Highlighter works without skelc."))
            .addComponent(diagnostics!!).addComponent(compatible!!)
            .addLabeledComponent("Schema baseline:", baseline!!)
            .addComponent(JLabel("Empty uses Git HEAD; relative paths resolve from the domain source directory."))
            .addComponentFillVertically(JPanel(), 0).panel
        reset()
        return panel!!
    }
    private fun edited() = SkelSettings.Options(
        SkelServerCommand.normalize(executable?.text.orEmpty()), enabled?.isSelected ?: true,
        diagnostics?.isSelected ?: true, compatible?.isSelected ?: false, baseline?.text.orEmpty().trim()
    )
    override fun isModified() = panel != null && edited() != settings.state
    override fun apply() {
        if (!isModified) return
        settings.loadState(edited())
        LspServerManager.getInstance(project).stopAndRestartIfNeeded(SkelLspServerSupportProvider::class.java)
    }
    override fun reset() {
        val state = settings.state
        executable?.text = state.executable
        enabled?.isSelected = state.enabled
        diagnostics?.isSelected = state.compatibilityDiagnostics
        compatible?.isSelected = state.includeCompatible
        baseline?.text = state.baseline
    }
    override fun disposeUIResources() {
        panel = null; executable = null; enabled = null
        diagnostics = null; compatible = null; baseline = null
    }
}
