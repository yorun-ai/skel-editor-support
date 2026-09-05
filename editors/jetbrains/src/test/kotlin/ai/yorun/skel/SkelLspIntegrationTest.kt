package ai.yorun.skel

import org.eclipse.lsp4j.*
import org.eclipse.lsp4j.launch.LSPLauncher
import org.eclipse.lsp4j.services.LanguageClient
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import java.nio.file.Files
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit

/** Exercises the production command with the real skelc server and JetBrains' LSP4J. */
class SkelLspIntegrationTest {
    @Test fun realServerLifecycleAndEditing() {
        val executable = System.getProperty("skelc.path", "")
        assumeTrue("Set SKELC_PATH to run real skelc integration", executable.isNotBlank())
        val directory = Files.createTempDirectory("skel-jetbrains-lsp")
        val file = directory.resolve("example.skel")
        val text = "domain example\n\ndata Customer {\n    id: uuid\n}\n"
        Files.writeString(file, text)
        val process = SkelServerCommand.verified(executable, directory.toString()).createProcess()
        val diagnostics = LinkedBlockingQueue<PublishDiagnosticsParams>()
        val client = object : LanguageClient {
            override fun telemetryEvent(value: Any?) {}
            override fun publishDiagnostics(params: PublishDiagnosticsParams) { diagnostics.offer(params) }
            override fun showMessage(params: MessageParams) {}
            override fun showMessageRequest(params: ShowMessageRequestParams) =
                java.util.concurrent.CompletableFuture.completedFuture<MessageActionItem>(null)
            override fun logMessage(params: MessageParams) {}
        }
        val launcher = LSPLauncher.createClientLauncher(client, process.inputStream, process.outputStream)
        val listening = launcher.startListening()
        val server = launcher.remoteProxy
        try {
            val params = InitializeParams().apply {
                processId = ProcessHandle.current().pid().toInt()
                capabilities = ClientCapabilities()
                workspaceFolders = listOf(WorkspaceFolder(directory.toUri().toString(), "example"))
                initializationOptions = mapOf("schemaCompatibility" to mapOf("diagnostics" to false, "codeLens" to false))
            }
            val initialized = server.initialize(params).get(15, TimeUnit.SECONDS)
            assertNotNull(initialized.capabilities.completionProvider)
            assertNotNull(initialized.capabilities.definitionProvider)
            server.initialized(InitializedParams())
            val uri = file.toUri().toString()
            server.textDocumentService.didOpen(DidOpenTextDocumentParams(TextDocumentItem(uri, "skel", 1, text)))
            val published = diagnostics.poll(15, TimeUnit.SECONDS)
            assertNotNull("Expected diagnostics after didOpen", published)
            assertEquals(uri, published!!.uri)
            assertTrue(published.diagnostics.toString(), published.diagnostics.none { it.severity == DiagnosticSeverity.Error })
            val symbols = server.textDocumentService.documentSymbol(DocumentSymbolParams(TextDocumentIdentifier(uri))).get(10, TimeUnit.SECONDS)
            assertTrue("Expected Customer symbol", symbols.any { if (it.isRight) it.right.name == "Customer" else it.left.name == "Customer" })
            val formatted = server.textDocumentService.formatting(DocumentFormattingParams(TextDocumentIdentifier(uri), FormattingOptions(4, true))).get(10, TimeUnit.SECONDS)
            assertNotNull(formatted)
            diagnostics.clear()
            server.textDocumentService.didChange(DidChangeTextDocumentParams(
                VersionedTextDocumentIdentifier(uri, 2), listOf(TextDocumentContentChangeEvent("domain example\ndata Customer { id: UnknownType }"))
            ))
            val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(15)
            var foundError = false
            while (System.nanoTime() < deadline && !foundError) {
                foundError = diagnostics.poll(1, TimeUnit.SECONDS)?.diagnostics?.any { it.severity == DiagnosticSeverity.Error } == true
            }
            assertTrue("Expected semantic diagnostic after didChange", foundError)
            server.textDocumentService.didClose(DidCloseTextDocumentParams(TextDocumentIdentifier(uri)))
            server.shutdown().get(10, TimeUnit.SECONDS)
            server.exit()
            assertTrue("Server should exit after shutdown/exit", process.waitFor(10, TimeUnit.SECONDS))
        } finally {
            listening.cancel(true)
            process.destroyForcibly()
            directory.toFile().deleteRecursively()
        }
    }
}
