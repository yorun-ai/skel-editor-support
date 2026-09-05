package ai.yorun.skel

import com.intellij.lang.Language
import com.intellij.openapi.fileTypes.LanguageFileType
import com.intellij.openapi.util.IconLoader
import com.intellij.psi.tree.IElementType
import java.util.Properties

object SkelLanguage : Language("skel")

class SkelFileType private constructor() : LanguageFileType(SkelLanguage) {
    override fun getName() = "Skel"
    override fun getDescription() = "Skel contract"
    override fun getDefaultExtension() = "skel"
    override fun getIcon() = SkelIcons.FILE
    companion object { @JvmField val INSTANCE = SkelFileType() }
}

object SkelIcons {
    val FILE = IconLoader.getIcon("/icons/skel.svg", SkelIcons::class.java)
}

internal object SkelVocabulary {
    private val properties = Properties().apply {
        SkelVocabulary::class.java.getResourceAsStream("/skel/language.properties").use {
            requireNotNull(it) { "Missing generated Skel vocabulary" }
            load(it)
        }
    }
    val keywords = properties.getProperty("keywords").split(',').toSet()
    val builtinTypes = properties.getProperty("builtinTypes").split(',').toSet()
    val minimumVersion: String = properties.getProperty("minimumVersion")
}

object SkelTokens {
    val KEYWORD = IElementType("KEYWORD", SkelLanguage)
    val TYPE = IElementType("TYPE", SkelLanguage)
    val IDENTIFIER = IElementType("IDENTIFIER", SkelLanguage)
    val ANNOTATION = IElementType("ANNOTATION", SkelLanguage)
    val STRING = IElementType("STRING", SkelLanguage)
    val LINE_COMMENT = IElementType("LINE_COMMENT", SkelLanguage)
    val BLOCK_COMMENT = IElementType("BLOCK_COMMENT", SkelLanguage)
    val NUMBER = IElementType("NUMBER", SkelLanguage)
    val PUNCTUATION = IElementType("PUNCTUATION", SkelLanguage)
    val LBRACE = IElementType("LBRACE", SkelLanguage)
    val RBRACE = IElementType("RBRACE", SkelLanguage)
    val LPAREN = IElementType("LPAREN", SkelLanguage)
    val RPAREN = IElementType("RPAREN", SkelLanguage)
    val LBRACKET = IElementType("LBRACKET", SkelLanguage)
    val RBRACKET = IElementType("RBRACKET", SkelLanguage)
}
