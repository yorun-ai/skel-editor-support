package ai.yorun.skel

import com.google.gson.JsonParser
import com.intellij.execution.ExecutionException
import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.execution.process.CapturingProcessHandler
import java.nio.charset.StandardCharsets

internal object SkelServerCommand {
    fun normalize(value: String) = value.trim().ifEmpty { "skelc" }

    fun supports(version: String, minimum: String = SkelVocabulary.minimumVersion): Boolean {
        if (version == "v0.0.0-dev") return true
        val pattern = Regex("^v?(\\d+)\\.(\\d+)\\.(\\d+)(?:-([0-9A-Za-z.-]+))?(?:\\+[0-9A-Za-z.-]+)?$")
        val actual = pattern.matchEntire(version) ?: return false
        val required = pattern.matchEntire(minimum) ?: return false
        for (index in 1..3) {
            val comparison = actual.groupValues[index].toBigInteger().compareTo(required.groupValues[index].toBigInteger())
            if (comparison != 0) return comparison > 0
        }
        return actual.groupValues[4].isEmpty()
    }

    fun versionFromJson(output: String): String = try {
        JsonParser.parseString(output).asJsonObject.get("version").asString
    } catch (error: RuntimeException) {
        throw ExecutionException("Cannot read skelc version JSON. Configure the executable in Settings | Languages & Frameworks | Skel.", error)
    }

    fun command(executable: String, argument: String, workDirectory: String?): GeneralCommandLine =
        GeneralCommandLine(normalize(executable), argument)
            .withCharset(StandardCharsets.UTF_8)
            .withParentEnvironmentType(GeneralCommandLine.ParentEnvironmentType.CONSOLE)
            .apply { if (workDirectory != null) withWorkDirectory(workDirectory) }

    fun verified(executable: String, workDirectory: String?): GeneralCommandLine {
        val output = try {
            CapturingProcessHandler(command(executable, "version", workDirectory)).runProcess(5000)
        } catch (error: ExecutionException) {
            throw ExecutionException("Cannot run ${normalize(executable)}. Configure its executable in Settings | Languages & Frameworks | Skel.", error)
        }
        if (output.isTimeout || output.exitCode != 0) {
            throw ExecutionException("skelc version failed or timed out. Check the executable in Settings | Languages & Frameworks | Skel.")
        }
        val version = versionFromJson(output.stdout)
        if (!supports(version)) {
            throw ExecutionException("skelc $version is unsupported; ${SkelVocabulary.minimumVersion} or newer is required.")
        }
        return command(executable, "lsp", workDirectory)
    }
}
