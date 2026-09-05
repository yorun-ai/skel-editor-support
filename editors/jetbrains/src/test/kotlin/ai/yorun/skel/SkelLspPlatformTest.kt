package ai.yorun.skel

import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.vfs.newvfs.impl.VfsRootAccess
import com.intellij.openapi.vfs.LocalFileSystem
import com.intellij.platform.lsp.api.LspClientManager
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
        VfsRootAccess.allowRootAccess(testRootDisposable, directory.toString())
        Files.createDirectories(directory)
        val path = directory.resolve("client-lifecycle.skel")
        Files.writeString(path, "domain example\ndata Customer { id: uuid }\n")
        val file = LocalFileSystem.getInstance().refreshAndFindFileByNioFile(path)!!
        com.intellij.openapi.command.WriteCommandAction.runWriteCommandAction(project) {
            com.intellij.testFramework.PsiTestUtil.addContentRoot(module, file.parent)
        }
        assertTrue("Physical Skel file must be supported", SkelLspIntegrationProvider.supports(file))
        assertTrue("Fixture must be trusted", com.intellij.ide.trustedProjects.TrustedProjects.isProjectTrusted(project))
        val manager = LspClientManager.getInstance(project)
        val provider = SkelLspIntegrationProvider::class.java
        try {
            FileEditorManager.getInstance(project).openFile(file, false)
            manager.startClientsIfNeeded(provider)
            await("registered client initialization") {
                manager.getClients(provider).any { it.state == LspServerState.Running }
            }
            val initial = manager.getClients(provider).first { it.state == LspServerState.Running }
            assertEquals("skel", initial.descriptor.getLanguageId(file))
            assertNotNull(initial.initializeResult?.capabilities?.completionProvider)
            manager.stopAndRestartClientsIfNeeded(provider)
            await("client restart") {
                manager.getClients(provider).any { it !== initial && it.state == LspServerState.Running }
            }
            settings.state.enabled = false
            manager.stopAndRestartClientsIfNeeded(provider)
            await("disabled client stops") { manager.getClients(provider).none { it.state == LspServerState.Running } }
        } finally {
            settings.state.enabled = false
            manager.stopClients(provider)
            FileEditorManager.getInstance(project).closeFile(file)
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
