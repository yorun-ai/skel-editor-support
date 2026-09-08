package ai.yorun.skel

import org.junit.Assert.*
import org.junit.Test
import java.nio.file.Files
import java.nio.file.StandardCopyOption

class SkelExecutableStampTest {
    @Test fun detectsReplacementAndSymlinkRetargeting() {
        val directory = Files.createTempDirectory("skel-monitor-")
        try {
            val executable = directory.resolve("skelc")
            Files.writeString(executable, "old")
            executable.toFile().setExecutable(true)
            val first = executableStamp("skelc", directory.toString(), mapOf("PATH" to directory.toString()))!!
            val replacement = directory.resolve("next")
            Files.writeString(replacement, "new")
            replacement.toFile().setExecutable(true)
            Files.move(replacement, executable, StandardCopyOption.REPLACE_EXISTING)
            val second = executableStamp(executable.toString(), null, emptyMap())!!
            assertNotEquals(first.identity, second.identity)
            val link = directory.resolve("link")
            Files.createSymbolicLink(link, executable)
            val linked = executableStamp(link.toString(), null, emptyMap())!!
            assertTrue(linked.paths.contains(executable.toRealPath()))
            Files.writeString(replacement, "another")
            replacement.toFile().setExecutable(true)
            Files.delete(link)
            Files.createSymbolicLink(link, replacement)
            assertNotEquals(linked.identity, executableStamp(link.toString(), null, emptyMap())!!.identity)
            Files.delete(replacement)
            assertNull(executableStamp(link.toString(), null, emptyMap()))
        } finally { directory.toFile().deleteRecursively() }
    }
}
