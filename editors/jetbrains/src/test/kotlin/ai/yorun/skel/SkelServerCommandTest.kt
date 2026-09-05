package ai.yorun.skel

import com.intellij.execution.ExecutionException
import org.junit.Assert.*
import org.junit.Test

class SkelServerCommandTest {
    @Test fun versionsMatchExistingClientPolicy() {
        for (version in listOf("v0.14.0", "0.14.0+build", "v0.15.0", "v1.0.0", "v0.0.0-dev")) {
            assertTrue(version, SkelServerCommand.supports(version))
        }
        for (version in listOf("", "unknown", "v0.13.9", "v0.14.0-rc.1", "v0.14")) {
            assertFalse(version, SkelServerCommand.supports(version))
        }
    }
    @Test fun executablePathsAreSingleArguments() {
        val command = SkelServerCommand.command(" /tools with spaces/skelc ", "lsp", null)
        assertEquals("/tools with spaces/skelc", command.exePath)
        assertEquals(listOf("lsp"), command.parametersList.list)
        assertEquals("skelc", SkelServerCommand.normalize("  "))
    }
    @Test fun parsesActualVersionShape() {
        assertEquals("v0.15.0", SkelServerCommand.versionFromJson("""{"name":"Skelc CLI","version":"v0.15.0"}"""))
    }
    @Test(expected = ExecutionException::class) fun rejectsMalformedVersionOutput() {
        SkelServerCommand.versionFromJson("skelc v0.15.0")
    }
    @Test fun defaultsDisableUnsupportedReportLens() {
        assertEquals(false, SkelSettings.Options().compatibilityOptions()["codeLens"])
        assertEquals("baseline.json", SkelSettings.Options(baseline = " baseline.json ").compatibilityOptions()["baseline"])
    }
}
