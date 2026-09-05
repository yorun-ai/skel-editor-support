import org.jetbrains.intellij.platform.gradle.TestFrameworkType

plugins {
    kotlin("jvm") version "2.4.10"
    id("org.jetbrains.intellij.platform") version "2.18.1"
}

group = "ai.yorun"
version = providers.gradleProperty("pluginVersion").get()

repositories {
    mavenCentral()
    intellijPlatform { defaultRepositories() }
}

dependencies {
    intellijPlatform {
        val localPath = providers.gradleProperty("localPlatformPath")
        if (localPath.isPresent) local(localPath.get())
        else goland(providers.gradleProperty("platformVersion").get())
        testFramework(TestFrameworkType.Platform)
        pluginVerifier()
        zipSigner()
    }
    testImplementation("junit:junit:4.13.2")
}

kotlin { jvmToolchain(21) }

val generateLanguageResources = tasks.register<Exec>("generateLanguageResources") {
    inputs.files("../../packages/highlight/src/language.js", "../vscode/skelc-compatibility.json")
    inputs.file("scripts/generate-resources.mjs")
    outputs.dir(layout.buildDirectory.dir("generated/resources"))
    commandLine("node", "scripts/generate-resources.mjs", layout.buildDirectory.dir("generated/resources").get().asFile)
}
sourceSets.main { resources.srcDir(generateLanguageResources) }
sourceSets.test { resources.srcDir("../../packages/highlight/test/fixtures") }

intellijPlatform {
    pluginConfiguration {
        name = "Skel Language Support"
        ideaVersion { sinceBuild = "252.25557.131"; untilBuild = provider { null } }
    }
    signing {
        certificateChain = providers.environmentVariable("JETBRAINS_CERTIFICATE_CHAIN")
        privateKey = providers.environmentVariable("JETBRAINS_PRIVATE_KEY")
        password = providers.environmentVariable("JETBRAINS_PRIVATE_KEY_PASSWORD")
    }
    publishing { token = providers.environmentVariable("JETBRAINS_MARKETPLACE_TOKEN") }
    pluginVerification {
        ides {
            val localVerificationPath = providers.gradleProperty("localVerificationPath")
            if (localVerificationPath.isPresent) local(file(localVerificationPath.get()))
            else {
                create("GO", providers.gradleProperty("platformVersion").get())
                create("IU", providers.gradleProperty("platformVersion").get())
                create("GO", "2026.2.2")
                create("IU", "2026.2.2")
            }
        }
    }
}

tasks.test {
    systemProperty("skelc.path", providers.environmentVariable("SKELC_PATH").getOrElse(""))
}

// Include the project's license in the installable plugin JAR.
tasks.processResources { from("../../LICENSE") { into("META-INF") } }
