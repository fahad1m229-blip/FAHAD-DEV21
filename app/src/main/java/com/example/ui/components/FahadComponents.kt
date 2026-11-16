package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Android
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.Computer
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.SmartToy
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.AppLanguage
import com.example.model.CategoryIconType
import com.example.model.DevCategory
import com.example.model.ResourceLink
import com.example.model.ResourceProvider
import com.example.model.SocialChannel
import com.example.model.VersionItem
import com.example.ui.theme.CyberBg
import com.example.ui.theme.CyberCyan
import com.example.ui.theme.CyberGold
import com.example.ui.theme.CyberGreen
import com.example.ui.theme.CyberPrimary
import com.example.ui.theme.CyberPrimaryGlow
import com.example.ui.theme.CyberViolet
import com.example.ui.theme.JetBrainsMonoFamily
import kotlinx.coroutines.delay

fun categoryIcon(type: CategoryIconType): ImageVector = when (type) {
  CategoryIconType.WEB -> Icons.Default.Language
  CategoryIconType.APK -> Icons.Default.Android
  CategoryIconType.BOT -> Icons.Default.SmartToy
  CategoryIconType.SECURITY -> Icons.Default.Security
  CategoryIconType.API -> Icons.Default.Code
  CategoryIconType.REVIEW -> Icons.Default.Star
  CategoryIconType.PC -> Icons.Default.Computer
}

@Composable
fun VerifiedDeveloperBadge(modifier: Modifier = Modifier) {
  Icon(
    imageVector = Icons.Default.Verified,
    contentDescription = "Verified Developer",
    tint = CyberPrimary,
    modifier = modifier.size(20.dp)
  )
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun HeroSectionCard(
  language: AppLanguage,
  socialChannels: List<SocialChannel>,
  onSocialClick: (SocialChannel) -> Unit,
  onWatchVideoClick: () -> Unit
) {
  val subtitles = if (language == AppLanguage.EN) {
    listOf(
      "Creative Developer • Video Creator",
      "3D Web Architect • APK & Bot Builder",
      "Security Researcher • Automation Engineer"
    )
  } else {
    listOf(
      "ক্রিয়েটিভ ডেভেলপার • ভিডিও ক্রিয়েটর",
      "৩ডি ওয়েব আর্কিটেক্ট • APK ও বট বিল্ডার",
      "সিকিউরিটি রিসার্চার • অটোমেশন ইঞ্জিনিয়ার"
    )
  }

  var typedText by remember(language) { mutableStateOf("") }
  LaunchedEffect(language) {
    var phraseIdx = 0
    while (true) {
      val target = subtitles[phraseIdx]
      for (i in 1..target.length) {
        typedText = target.substring(0, i)
        delay(45)
      }
      delay(1600)
      for (i in target.length downTo 0) {
        typedText = target.substring(0, i)
        delay(24)
      }
      phraseIdx = (phraseIdx + 1) % subtitles.size
    }
  }

  Column(
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 16.dp, vertical = 12.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp)
  ) {
    Surface(
      shape = RoundedCornerShape(999.dp),
      color = CyberCyan.copy(alpha = 0.12f),
      border = BorderStroke(1.dp, CyberCyan.copy(alpha = 0.4f))
    ) {
      Row(
        modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
      ) {
        Box(
          modifier = Modifier
            .size(8.dp)
            .clip(CircleShape)
            .background(CyberCyan)
        )
        Text(
          text = if (language == AppLanguage.EN) "WELCOME TO DEVELOPER WEBSITE" else "ডেভেলপার ওয়েবসাইটে স্বাগতম",
          style = MaterialTheme.typography.labelSmall,
          color = CyberCyan
        )
      }
    }

    Row(
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
      Text(
        text = "FAHAD DEV",
        style = MaterialTheme.typography.displayLarge.copy(
          brush = Brush.linearGradient(listOf(Color.White, CyberPrimaryGlow, CyberViolet, CyberCyan))
        )
      )
      VerifiedDeveloperBadge(modifier = Modifier.size(28.dp))
    }

    Text(
      text = "$typedText|",
      style = MaterialTheme.typography.titleMedium.copy(
        brush = Brush.linearGradient(listOf(CyberCyan, CyberPrimaryGlow, CyberViolet))
      ),
      modifier = Modifier.height(24.dp)
    )

    FlowRow(
      horizontalArrangement = Arrangement.spacedBy(10.dp),
      verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
      socialChannels.forEach { channel ->
        OutlinedButton(
          onClick = { onSocialClick(channel) },
          shape = RoundedCornerShape(999.dp),
          border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
          modifier = Modifier
            .height(48.dp)
            .testTag("social_${channel.id}_btn")
        ) {
          Text(
            text = channel.name,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onBackground
          )
        }
      }
    }

    // Watch This Video Preview Card
    Card(
      shape = RoundedCornerShape(22.dp),
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
      border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
      modifier = Modifier
        .fillMaxWidth()
        .testTag("watch_video_card")
    ) {
      Column(
        modifier = Modifier.padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
      ) {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Text(
            text = if (language == AppLanguage.EN) "WATCH THIS VIDEO" else "এই ভিডিওটি দেখুন",
            style = MaterialTheme.typography.labelMedium,
            color = CyberCyan
          )
          Surface(
            shape = RoundedCornerShape(999.dp),
            color = CyberCyan.copy(alpha = 0.16f)
          ) {
            Text(
              text = "HD",
              style = MaterialTheme.typography.labelSmall,
              color = CyberCyan,
              modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp)
            )
          }
        }

        Box(
          modifier = Modifier
            .fillMaxWidth()
            .height(140.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(
              Brush.linearGradient(
                listOf(CyberBg, Color(0xFF101D42), Color(0xFF1E1340))
              )
            )
            .border(1.dp, CyberPrimary.copy(alpha = 0.35f), RoundedCornerShape(16.dp))
            .clickable(onClick = onWatchVideoClick),
          contentAlignment = Alignment.Center
        ) {
          Box(
            modifier = Modifier
              .size(60.dp)
              .clip(CircleShape)
              .background(Brush.linearGradient(listOf(CyberPrimary, CyberViolet))),
            contentAlignment = Alignment.Center
          ) {
            Icon(
              imageVector = Icons.Default.PlayArrow,
              contentDescription = "Play featured video",
              tint = Color.White,
              modifier = Modifier.size(32.dp)
            )
          }
        }
      }
    }

    // Developer Code Card
    Card(
      shape = RoundedCornerShape(18.dp),
      colors = CardDefaults.cardColors(containerColor = Color(0xE005070F)),
      border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
      modifier = Modifier.fillMaxWidth()
    ) {
      Column {
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xA60F1834))
            .padding(horizontal = 14.dp, vertical = 10.dp),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Box(Modifier.size(10.dp).clip(CircleShape).background(Color(0xFFFB7185)))
            Box(Modifier.size(10.dp).clip(CircleShape).background(CyberGold))
            Box(Modifier.size(10.dp).clip(CircleShape).background(CyberGreen))
          }
          Text(
            text = "developer.profile.js",
            style = MaterialTheme.typography.labelSmall,
            color = Color(0xFF8A97B8)
          )
        }
        val codeText = buildAnnotatedString {
          withStyle(SpanStyle(color = Color(0xFFC084FC))) { append("const ") }
          withStyle(SpanStyle(color = CyberCyan)) { append("dev ") }
          withStyle(SpanStyle(color = Color(0xFF94A3B8))) { append("= ") }
          withStyle(SpanStyle(color = CyberGold)) { append("{\n") }
          withStyle(SpanStyle(color = CyberPrimaryGlow)) { append("  name") }
          withStyle(SpanStyle(color = Color(0xFF94A3B8))) { append(": ") }
          withStyle(SpanStyle(color = CyberGreen)) { append("\"FAHAD DEV\"") }
          append(",\n")
          withStyle(SpanStyle(color = CyberPrimaryGlow)) { append("  role") }
          withStyle(SpanStyle(color = Color(0xFF94A3B8))) { append(": ") }
          withStyle(SpanStyle(color = CyberGreen)) { append("\"Creative Developer\"") }
          append(",\n")
          withStyle(SpanStyle(color = CyberPrimaryGlow)) { append("  passion") }
          withStyle(SpanStyle(color = Color(0xFF94A3B8))) { append(": ") }
          withStyle(SpanStyle(color = CyberGreen)) { append("\"Building Digital Experiences\"") }
          append(",\n")
          withStyle(SpanStyle(color = CyberPrimaryGlow)) { append("  status") }
          withStyle(SpanStyle(color = Color(0xFF94A3B8))) { append(": ") }
          withStyle(SpanStyle(color = CyberGreen)) { append("\"Available\"") }
          withStyle(SpanStyle(color = CyberGold)) { append("\n};") }
        }
        Text(
          text = codeText,
          fontFamily = JetBrainsMonoFamily,
          fontSize = 13.sp,
          lineHeight = 21.sp,
          color = Color(0xFFEAF0FF),
          modifier = Modifier.padding(16.dp)
        )
      }
    }
  }
}

@Composable
fun ExploreTile(
  category: DevCategory,
  language: AppLanguage,
  onClick: () -> Unit,
  modifier: Modifier = Modifier
) {
  Card(
    shape = RoundedCornerShape(18.dp),
    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
    modifier = modifier
      .clip(RoundedCornerShape(18.dp))
      .clickable(onClick = onClick)
      .testTag("explore_card_${category.id}")
  ) {
    Column(
      modifier = Modifier.padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Text(
          text = category.number,
          style = MaterialTheme.typography.titleLarge,
          color = CyberPrimaryGlow
        )
        Icon(
          imageVector = categoryIcon(category.iconType),
          contentDescription = null,
          tint = CyberCyan,
          modifier = Modifier.size(22.dp)
        )
      }
      Text(
        text = if (language == AppLanguage.EN) category.titleEn else category.titleBn,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.SemiBold,
        maxLines = 1
      )
    }
  }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CategoryCyberCard(
  category: DevCategory,
  language: AppLanguage,
  onViewClick: () -> Unit
) {
  Card(
    shape = RoundedCornerShape(24.dp),
    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 16.dp)
      .testTag("category_card_${category.id}")
  ) {
    Box(modifier = Modifier.fillMaxWidth()) {
      // Diagonal Ribbon Badge
      Box(
        modifier = Modifier
          .align(Alignment.TopEnd)
          .offset(x = 26.dp, y = 14.dp)
          .rotate(38f)
          .background(Brush.horizontalGradient(listOf(CyberPrimary, CyberViolet)))
          .padding(horizontal = 34.dp, vertical = 4.dp)
      ) {
        Text(
          text = category.ribbon,
          style = MaterialTheme.typography.labelSmall,
          color = Color.White
        )
      }

      Column(
        modifier = Modifier.padding(22.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
      ) {
        Row(
          modifier = Modifier.fillMaxWidth().padding(end = 42.dp),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.Top
        ) {
          Box(
            modifier = Modifier
              .size(52.dp)
              .clip(RoundedCornerShape(16.dp))
              .background(
                Brush.linearGradient(
                  listOf(CyberPrimary.copy(alpha = 0.25f), CyberCyan.copy(alpha = 0.16f))
                )
              )
              .border(1.dp, CyberPrimaryGlow.copy(alpha = 0.4f), RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center
          ) {
            Icon(
              imageVector = categoryIcon(category.iconType),
              contentDescription = category.titleEn,
              tint = CyberCyan,
              modifier = Modifier.size(26.dp)
            )
          }

          FlowRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
          ) {
            PillBadge(
              text = if (language == AppLanguage.EN) "100% FREE" else "১০০% ফ্রি",
              color = CyberCyan
            )
            if (category.isNew) {
              PillBadge(
                text = if (language == AppLanguage.EN) "NEW" else "নতুন",
                color = CyberViolet
              )
            }
            if (category.isPopular) {
              PillBadge(
                text = if (language == AppLanguage.EN) "POPULAR" else "জনপ্রিয়",
                color = CyberGold
              )
            }
          }
        }

        Text(
          text = category.number,
          style = MaterialTheme.typography.labelMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Text(
          text = if (language == AppLanguage.EN) category.titleEn else category.titleBn,
          style = MaterialTheme.typography.headlineMedium
        )

        Text(
          text = if (language == AppLanguage.EN) category.descEn else category.descBn,
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Button(
          onClick = onViewClick,
          shape = RoundedCornerShape(14.dp),
          colors = ButtonDefaults.buttonColors(containerColor = CyberPrimary),
          modifier = Modifier
            .height(48.dp)
            .testTag("view_category_${category.id}_btn")
        ) {
          Text(
            text = if (language == AppLanguage.EN) "VIEW" else "দেখুন",
            style = MaterialTheme.typography.labelMedium,
            color = Color.White
          )
          Spacer(Modifier.width(8.dp))
          Icon(
            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
            contentDescription = null,
            tint = Color.White,
            modifier = Modifier.size(18.dp)
          )
        }
      }
    }
  }
}

@Composable
fun PillBadge(text: String, color: Color) {
  Surface(
    shape = RoundedCornerShape(999.dp),
    color = color.copy(alpha = 0.16f),
    border = BorderStroke(1.dp, color.copy(alpha = 0.4f))
  ) {
    Text(
      text = text,
      style = MaterialTheme.typography.labelSmall,
      color = color,
      modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
    )
  }
}

@Composable
fun VersionRowCard(
  version: VersionItem,
  downloads: Int,
  language: AppLanguage,
  onViewClick: () -> Unit
) {
  Card(
    shape = RoundedCornerShape(16.dp),
    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
    modifier = Modifier.fillMaxWidth()
  ) {
    Row(
      modifier = Modifier.padding(16.dp),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      Column(
        modifier = Modifier.weight(1f).padding(end = 12.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
      ) {
        Row(
          horizontalArrangement = Arrangement.spacedBy(8.dp),
          verticalAlignment = Alignment.CenterVertically
        ) {
          Surface(
            shape = RoundedCornerShape(999.dp),
            color = CyberPrimary
          ) {
            Text(
              text = version.tag,
              style = MaterialTheme.typography.labelMedium,
              color = Color.White,
              modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
            )
          }
          if (version.isNew) PillBadge("NEW", CyberViolet)
          if (version.isPopular) PillBadge("POPULAR", CyberGold)
        }
        Text(
          text = if (language == AppLanguage.EN) version.notesEn else version.notesBn,
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
          text = if (language == AppLanguage.EN) "Downloads: $downloads" else "ডাউনলোড: $downloads",
          style = MaterialTheme.typography.labelSmall,
          color = CyberCyan
        )
      }
      Button(
        onClick = onViewClick,
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
          .height(48.dp)
          .testTag("view_version_${version.id}_btn")
      ) {
        Text(if (language == AppLanguage.EN) "VIEW" else "দেখুন")
      }
    }
  }
}

@Composable
fun ResourceLinkCard(
  link: ResourceLink,
  language: AppLanguage,
  onOpen: (String) -> Unit,
  onCopy: (String) -> Unit,
  onShare: (String) -> Unit
) {
  val safeUrl = link.url?.takeIf { it.startsWith("https://") || it.startsWith("http://") }
  val icon = when (link.provider) {
    ResourceProvider.RENDER, ResourceProvider.NETLIFY -> Icons.Default.Language
    ResourceProvider.GITHUB -> Icons.Default.Code
    ResourceProvider.POSTIMAGES -> Icons.Default.CheckCircle
    ResourceProvider.DOWNLOAD -> Icons.Default.Download
    ResourceProvider.YOUTUBE -> Icons.Default.PlayArrow
  }

  Card(
    shape = RoundedCornerShape(16.dp),
    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
    modifier = Modifier.fillMaxWidth()
  ) {
    Column(
      modifier = Modifier.padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
      ) {
        Box(
          modifier = Modifier
            .size(40.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(CyberPrimary.copy(alpha = 0.18f)),
          contentAlignment = Alignment.Center
        ) {
          Icon(imageVector = icon, contentDescription = link.label, tint = CyberCyan)
        }
        Column {
          Text(text = link.label, style = MaterialTheme.typography.titleMedium)
          Text(
            text = if (safeUrl != null) "Verified HTTPS" else if (language == AppLanguage.EN) "Pending Admin URL" else "অ্যাডমিন লিংক পেন্ডিং",
            style = MaterialTheme.typography.labelSmall,
            color = if (safeUrl != null) CyberGreen else CyberGold
          )
        }
      }

      if (safeUrl != null) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
          Button(
            onClick = { onOpen(safeUrl) },
            modifier = Modifier.height(48.dp)
          ) {
            Text(if (language == AppLanguage.EN) "Open" else "খুলুন")
          }
          OutlinedButton(
            onClick = { onCopy(safeUrl) },
            modifier = Modifier.height(48.dp)
          ) {
            Icon(Icons.Default.ContentCopy, contentDescription = "Copy Link", modifier = Modifier.size(18.dp))
          }
          OutlinedButton(
            onClick = { onShare(safeUrl) },
            modifier = Modifier.height(48.dp)
          ) {
            Icon(Icons.Default.Share, contentDescription = "Share Link", modifier = Modifier.size(18.dp))
          }
        }
      } else {
        Text(
          text = if (language == AppLanguage.EN) {
            "This resource slot is ready for a verified Firestore URL configured in the Admin Panel."
          } else {
            "অ্যাডমিন প্যানেল থেকে ভেরিফাইড Firestore লিংক যোগ করলে এটি সক্রিয় হবে।"
          },
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )
      }
    }
  }
}
