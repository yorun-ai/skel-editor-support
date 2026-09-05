package ai.yorun.skel

import com.intellij.openapi.editor.DefaultLanguageHighlighterColors as Colors
import com.intellij.openapi.editor.HighlighterColors
import com.intellij.openapi.editor.colors.TextAttributesKey
import com.intellij.openapi.fileTypes.SyntaxHighlighterBase
import com.intellij.openapi.fileTypes.SyntaxHighlighterFactory
import com.intellij.openapi.options.colors.AttributesDescriptor
import com.intellij.openapi.options.colors.ColorDescriptor
import com.intellij.openapi.options.colors.ColorSettingsPage
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.psi.TokenType
import com.intellij.psi.tree.IElementType

class SkelSyntaxHighlighter : SyntaxHighlighterBase() {
    override fun getHighlightingLexer() = SkelLexer()
    override fun getTokenHighlights(tokenType: IElementType): Array<TextAttributesKey> = pack(attributes[tokenType])

    companion object {
        private fun key(name: String, fallback: TextAttributesKey) = TextAttributesKey.createTextAttributesKey("SKEL_$name", fallback)
        val KEYWORD = key("KEYWORD", Colors.KEYWORD)
        val TYPE = key("TYPE", Colors.CLASS_NAME)
        val ANNOTATION = key("ANNOTATION", Colors.METADATA)
        val STRING = key("STRING", Colors.STRING)
        val LINE_COMMENT = key("LINE_COMMENT", Colors.LINE_COMMENT)
        val BLOCK_COMMENT = key("BLOCK_COMMENT", Colors.BLOCK_COMMENT)
        val NUMBER = key("NUMBER", Colors.NUMBER)
        val PUNCTUATION = key("PUNCTUATION", Colors.OPERATION_SIGN)
        val BRACES = key("BRACES", Colors.BRACES)
        private val attributes = mapOf(
            SkelTokens.KEYWORD to KEYWORD, SkelTokens.TYPE to TYPE,
            SkelTokens.ANNOTATION to ANNOTATION, SkelTokens.STRING to STRING,
            SkelTokens.LINE_COMMENT to LINE_COMMENT, SkelTokens.BLOCK_COMMENT to BLOCK_COMMENT,
            SkelTokens.NUMBER to NUMBER, SkelTokens.PUNCTUATION to PUNCTUATION,
            SkelTokens.LBRACE to BRACES, SkelTokens.RBRACE to BRACES,
            SkelTokens.LPAREN to BRACES, SkelTokens.RPAREN to BRACES,
            SkelTokens.LBRACKET to BRACES, SkelTokens.RBRACKET to BRACES,
            TokenType.BAD_CHARACTER to HighlighterColors.BAD_CHARACTER
        )
    }
}

class SkelSyntaxHighlighterFactory : SyntaxHighlighterFactory() {
    override fun getSyntaxHighlighter(project: Project?, virtualFile: VirtualFile?) = SkelSyntaxHighlighter()
}

class SkelColorSettingsPage : ColorSettingsPage {
    override fun getDisplayName() = "Skel"
    override fun getIcon() = SkelIcons.FILE
    override fun getHighlighter() = SkelSyntaxHighlighter()
    override fun getDemoText() = """
        // A Skel contract
        domain example
        @description("A customer")
        pub data Customer {
            id: uuid
            name: string
        }
    """.trimIndent()
    override fun getAdditionalHighlightingTagToDescriptorMap(): Map<String, TextAttributesKey>? = null
    override fun getColorDescriptors(): Array<ColorDescriptor> = ColorDescriptor.EMPTY_ARRAY
    override fun getAttributeDescriptors() = arrayOf(
        AttributesDescriptor("Keyword", SkelSyntaxHighlighter.KEYWORD),
        AttributesDescriptor("Type", SkelSyntaxHighlighter.TYPE),
        AttributesDescriptor("Decorator", SkelSyntaxHighlighter.ANNOTATION),
        AttributesDescriptor("String", SkelSyntaxHighlighter.STRING),
        AttributesDescriptor("Line comment", SkelSyntaxHighlighter.LINE_COMMENT),
        AttributesDescriptor("Block comment", SkelSyntaxHighlighter.BLOCK_COMMENT),
        AttributesDescriptor("Number", SkelSyntaxHighlighter.NUMBER),
        AttributesDescriptor("Punctuation", SkelSyntaxHighlighter.PUNCTUATION),
        AttributesDescriptor("Braces", SkelSyntaxHighlighter.BRACES)
    )
}
