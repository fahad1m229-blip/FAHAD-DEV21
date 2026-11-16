package com.example.model

enum class AppLanguage { EN, BN }

enum class CategoryIconType {
  WEB, APK, BOT, SECURITY, API, REVIEW, PC
}

enum class ResourceProvider {
  RENDER, GITHUB, NETLIFY, POSTIMAGES, DOWNLOAD, YOUTUBE
}

data class ResourceLink(
  val id: String,
  val provider: ResourceProvider,
  val label: String,
  val url: String? = null
)

data class VersionItem(
  val id: String,
  val tag: String,
  val notesEn: String,
  val notesBn: String,
  val isNew: Boolean = false,
  val isPopular: Boolean = false,
  val baseDownloads: Int = 0,
  val links: List<ResourceLink> = defaultProviderSlots()
)

data class DevCategory(
  val id: String,
  val number: String,
  val ribbon: String,
  val iconType: CategoryIconType,
  val titleEn: String,
  val titleBn: String,
  val descEn: String,
  val descBn: String,
  val isNew: Boolean = false,
  val isPopular: Boolean = false,
  val versions: List<VersionItem> = defaultVersions()
)

data class SocialChannel(
  val id: String,
  val name: String,
  val url: String
)

fun defaultProviderSlots(): List<ResourceLink> = listOf(
  ResourceLink("render", ResourceProvider.RENDER, "Render", null),
  ResourceLink("github", ResourceProvider.GITHUB, "GitHub", null),
  ResourceLink("netlify", ResourceProvider.NETLIFY, "Netlify", null),
  ResourceLink("postimages", ResourceProvider.POSTIMAGES, "Postimages", null),
  ResourceLink("download", ResourceProvider.DOWNLOAD, "Download Main File", null),
  ResourceLink("youtube", ResourceProvider.YOUTUBE, "YouTube Tutorial", null)
)

fun defaultVersions(): List<VersionItem> =
  listOf("V11.0", "V11.5", "V12.0", "V13.0", "V14.0", "V15.0", "V16.0").map { tag ->
    VersionItem(
      id = tag.lowercase().replace(".", "-"),
      tag = tag,
      notesEn = "Sample seed release $tag. Configure Firestore URLs in the admin panel for live mirrors.",
      notesBn = "স্যাম্পল সিড রিলিজ $tag। লাইভ মিরর লিংকের জন্য অ্যাডমিন প্যানেলে Firestore কনফিগার করুন।",
      isNew = tag == "V16.0",
      isPopular = tag == "V15.0" || tag == "V16.0"
    )
  }

object SeedCatalog {
  val socialChannels = listOf(
    SocialChannel("telegram", "Telegram", "https://t.me/"),
    SocialChannel("youtube", "YouTube", "https://www.youtube.com/"),
    SocialChannel("tiktok", "TikTok", "https://www.tiktok.com/")
  )

  val categories = listOf(
    DevCategory(
      id = "free-website",
      number = "01",
      ribbon = "WEB",
      iconType = CategoryIconType.WEB,
      titleEn = "Free Website",
      titleBn = "ফ্রি ওয়েবসাইট",
      descEn = "Responsive 3D glassmorphism templates, portfolios, and static deployment kits.",
      descBn = "রেসপন্সিভ ৩ডি গ্লাসমরফিজম টেমপ্লেট, পোর্টফোলিও এবং স্ট্যাটিক ডিপ্লয়মেন্ট কিট।",
      isNew = true,
      isPopular = true
    ),
    DevCategory(
      id = "apk-building",
      number = "02",
      ribbon = "APK",
      iconType = CategoryIconType.APK,
      titleEn = "APK Building",
      titleBn = "APK বিল্ডিং",
      descEn = "Modern Android Kotlin & Web-to-APK project structures with clean Material 3 UI.",
      descBn = "মডার্ন অ্যান্ড্রয়েড কটলিন এবং ম্যাটেরিয়াল ৩ ইউআই ভিত্তিক APK বিল্ড প্রজেক্ট।",
      isNew = false,
      isPopular = true
    ),
    DevCategory(
      id = "bot-making",
      number = "03",
      ribbon = "BOT",
      iconType = CategoryIconType.BOT,
      titleEn = "Bot Making",
      titleBn = "বট মেকিং",
      descEn = "Automated Telegram & Discord workflow bots with webhook and Firestore support.",
      descBn = "ওয়েবহুক ও ফায়ারস্টোর সাপোর্টসহ অটোমেটেড টেলিগ্রাম ও ডিসকর্ড বট সিস্টেম।",
      isNew = true,
      isPopular = false
    ),
    DevCategory(
      id = "security",
      number = "04",
      ribbon = "SEC",
      iconType = CategoryIconType.SECURITY,
      titleEn = "Security",
      titleBn = "সিকিউরিটি",
      descEn = "Hardened Firestore security rules, URL sanitizers, and defensive web audits.",
      descBn = "সুরক্ষিত Firestore সিকিউরিটি রুলস, URL ভ্যালিডেশন ও ওয়েব সিকিউরিটি গাইড।",
      isNew = false,
      isPopular = false
    ),
    DevCategory(
      id = "api-key",
      number = "05",
      ribbon = "API",
      iconType = CategoryIconType.API,
      titleEn = "API Key",
      titleBn = "API কী",
      descEn = "REST & JSON integration blueprints, proxy patterns, and token management tools.",
      descBn = "REST ও JSON ইন্টিগ্রেশন ব্লুপ্রিন্ট, প্রক্সি প্যাটার্ন এবং কী ম্যানেজমেন্ট টুলস।",
      isNew = false,
      isPopular = true
    ),
    DevCategory(
      id = "review-project",
      number = "06",
      ribbon = "REV",
      iconType = CategoryIconType.REVIEW,
      titleEn = "Review Project",
      titleBn = "রিভিউ প্রজেক্ট",
      descEn = "Featured community builds, code walkthroughs, and benchmark showcase projects.",
      descBn = "কমিউনিটি প্রজেক্ট রিভিউ, কোড ওয়াকথ্রু এবং পারফরম্যান্স শোকেস প্রজেক্ট।",
      isNew = false,
      isPopular = false
    ),
    DevCategory(
      id = "pc-tools",
      number = "07",
      ribbon = "PC",
      iconType = CategoryIconType.PC,
      titleEn = "PC Tools",
      titleBn = "পিসি টুলস",
      descEn = "Developer CLI utilities, Windows productivity scripts, and environment helpers.",
      descBn = "ডেভেলপার CLI ইউটিলিটি, উইন্ডোজ প্রোডাক্টিভিটি স্ক্রিপ্ট ও সেটআপ টুলস।",
      isNew = true,
      isPopular = false
    )
  )
}
