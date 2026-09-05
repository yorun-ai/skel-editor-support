package ai.yorun.skel

import com.intellij.psi.TokenType
import com.intellij.psi.tree.IElementType
import org.junit.Assert.*
import org.junit.Test

class SkelLexerTest {
    private fun tokens(text: String): List<Pair<IElementType, String>> {
        val lexer = SkelLexer()
        lexer.start(text)
        val result = mutableListOf<Pair<IElementType, String>>()
        while (lexer.tokenType != null) {
            assertTrue("Lexer must advance", lexer.tokenEnd > lexer.tokenStart)
            result += lexer.tokenType!! to text.substring(lexer.tokenStart, lexer.tokenEnd)
            lexer.advance()
        }
        assertEquals(text, result.joinToString("") { it.second })
        return result
    }

    @Test fun sharedVocabulary() {
        for (word in SkelVocabulary.keywords) assertEquals(SkelTokens.KEYWORD, tokens(word).single().first)
        for (word in SkelVocabulary.builtinTypes) assertEquals(SkelTokens.TYPE, tokens(word).single().first)
        assertEquals(SkelTokens.IDENTIFIER, tokens("domainName").single().first)
    }

    @Test fun multilineAndEscapedStrings() {
        val text = "\"escaped \\\" quote\" \"\"\"line one\n/* string, not comment */\nline two\"\"\""
        assertEquals(listOf(SkelTokens.STRING, TokenType.WHITE_SPACE, SkelTokens.STRING), tokens(text).map { it.first })
        assertEquals(SkelTokens.STRING, tokens("\"unfinished").single().first)
        assertEquals(SkelTokens.BLOCK_COMMENT, tokens("/* unfinished\ncomment").single().first)
    }

    @Test fun everyTokenBoundaryCanRestart() {
        val text = "domain sample\n/* multiple\nlines */\n@description(\"\"\"hello\nworld\"\"\")\ndata Person { id: uuid }"
        val lexer = SkelLexer()
        lexer.start(text)
        while (lexer.tokenType != null) {
            val restored = SkelLexer()
            restored.start(text, lexer.tokenStart, text.length, lexer.state)
            assertEquals(lexer.tokenType, restored.tokenType)
            assertEquals(lexer.tokenEnd, restored.tokenEnd)
            lexer.advance()
        }
    }

    @Test fun sharedFixtureAndIncompleteEdits() {
        val text = javaClass.getResource("/compatibility.skel")!!.readText()
        assertFalse(tokens(text).any { it.first == TokenType.BAD_CHARACTER })
        // Truncation models edits inside comments, strings, annotations and delimiters.
        for (end in 0..text.length) tokens(text.substring(0, end))
    }
}
