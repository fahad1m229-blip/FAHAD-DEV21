package com.example

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberDrawerState
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.model.AppLanguage
import com.example.ui.FahadViewModel
import com.example.ui.components.CategoryCyberCard
import com.example.ui.components.Cyber3DBackground
import com.example.ui.components.ExploreTile
import com.example.ui.components.HeroSectionCard
import com.example.ui.components.ResourceLinkCard
import com.example.ui.components.VerifiedDeveloperBadge
import com.example.ui.components.VersionRowCard
import com.example.ui.components.categoryIcon
import com.example.ui.theme.CyberCyan
import com.example.ui.theme.CyberPrimary
import com.example.ui.theme.FahadDevTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      val vm: FahadViewModel = viewModel()
      val state by vm.uiState.collectAsStateWithLifecycle()

      FahadDevTheme(darkTheme = state.isDarkTheme) {
        FahadDevApp(vm = vm)
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FahadDevApp(vm: FahadViewModel) {
  val state by vm.uiState.collectAsStateWithLifecycle()
  val context = LocalContext.current
  val scope = rememberCoroutineScope()
  val snackbarHostState = remember { SnackbarHostState() }
  val drawerState = rememberDrawerState(DrawerValue.Closed)
  val listState = rememberLazyListState()
  val showBackToTop by remember { derivedStateOf { listState.firstVisibleItemIndex > 1 } }

  val filteredCategories by remember(state.categories, state.searchQuery) {
    derivedStateOf {
      val q = state.searchQuery.trim().lowercase()
      if (q.isEmpty()) {
        state.categories
      } else {
        state.categories.filter { cat ->
          cat.titleEn.lowercase().contains(q) ||
            cat.titleBn.lowercase().contains(q) ||
            cat.descEn.lowercase().contains(q) ||
            cat.ribbon.lowercase().contains(q) ||
            cat.versions.any { it.tag.lowercase().contains(q) }
        }
      }
    }
  }

  BackHandler(enabled = drawerState.isOpen) {
    scope.launch { drawerState.close() }
  }

  ModalNavigationDrawer(
    drawerState = drawerState,
    drawerContent = {
      ModalDrawerSheet(
        drawerContainerColor = MaterialTheme.colorScheme.surface
      ) {
        Column(
          modifier = Modifier
            .padding(16.dp)
            .navigationBarsPadding(),
          verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.padding(vertical = 12.dp, horizontal = 8.dp)
          ) {
            Text(text = "FAHAD DEV", style = MaterialTheme.typography.titleLarge)
            VerifiedDeveloperBadge()
          }

          NavigationDrawerItem(
            label = { Text(if (state.language == AppLanguage.EN) "Home" else "হোম") },
            selected = state.selectedCategory == null,
            icon = { Icon(Icons.Default.Home, contentDescription = null) },
            onClick = {
              scope.launch {
                drawerState.close()
                listState.animateScrollToItem(0)
              }
            }
          )

          state.categories.forEach { cat ->
            NavigationDrawerItem(
              label = { Text(if (state.language == AppLanguage.EN) cat.titleEn else cat.titleBn) },
              selected = state.selectedCategory?.id == cat.id,
              icon = { Icon(categoryIcon(cat.iconType), contentDescription = null) },
              onClick = {
                scope.launch { drawerState.close() }
                vm.openCategory(cat)
              }
            )
          }
        }
      }
    }
  ) {
    Box(
      modifier = Modifier
        .fillMaxSize()
        .background(MaterialTheme.colorScheme.background)
    ) {
      Cyber3DBackground(isDark = state.isDarkTheme)

      Scaffold(
        containerColor = Color.Transparent,
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
          TopAppBar(
            colors = TopAppBarDefaults.topAppBarColors(
              containerColor = MaterialTheme.colorScheme.background.copy(alpha = 0.82f)
            ),
            title = {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
              ) {
                Text(
                  text = "FAHAD DEV",
                  style = MaterialTheme.typography.titleLarge
                )
                VerifiedDeveloperBadge()
              }
            },
            actions = {
              IconButton(
                onClick = vm::toggleSearch,
                modifier = Modifier.testTag("search_toggle_btn")
              ) {
                Icon(Icons.Default.Search, contentDescription = "Search")
              }
              IconButton(
                onClick = vm::toggleTheme,
                modifier = Modifier.testTag("theme_toggle_btn")
              ) {
                Icon(
                  imageVector = if (state.isDarkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                  contentDescription = "Toggle theme"
                )
              }
              TextButton(
                onClick = vm::toggleLanguage,
                modifier = Modifier.testTag("language_toggle_btn")
              ) {
                Text(
                  text = if (state.language == AppLanguage.EN) "বাং" else "EN",
                  style = MaterialTheme.typography.labelMedium,
                  color = CyberCyan
                )
              }
              IconButton(
                onClick = { scope.launch { drawerState.open() } },
                modifier = Modifier.testTag("menu_drawer_btn")
              ) {
                Icon(Icons.Default.MoreVert, contentDescription = "Open menu")
              }
            }
          )
        },
        floatingActionButton = {
          AnimatedVisibility(visible = showBackToTop) {
            FloatingActionButton(
              onClick = { scope.launch { listState.animateScrollToItem(0) } },
              containerColor = CyberPrimary,
              contentColor = Color.White,
              modifier = Modifier
                .navigationBarsPadding()
                .testTag("back_to_top_fab")
            ) {
              Icon(Icons.Default.KeyboardArrowUp, contentDescription = "Back to top")
            }
          }
        }
      ) { innerPadding ->
        Box(
          modifier = Modifier
            .fillMaxSize()
            .padding(innerPadding),
          contentAlignment = Alignment.TopCenter
        ) {
          LazyColumn(
            state = listState,
            contentPadding = PaddingValues(bottom = 84.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
            modifier = Modifier
              .widthIn(max = 720.dp)
              .fillMaxSize()
              .navigationBarsPadding()
          ) {
            if (state.isSearchVisible) {
              item(key = "search_bar") {
                OutlinedTextField(
                  value = state.searchQuery,
                  onValueChange = vm::updateSearchQuery,
                  singleLine = true,
                  placeholder = {
                    Text(
                      if (state.language == AppLanguage.EN) {
                        "Search categories or versions (e.g. V16.0, APK)..."
                      } else {
                        "ক্যাটাগরি বা ভার্সন খুঁজুন..."
                      }
                    )
                  },
                  trailingIcon = {
                    if (state.searchQuery.isNotEmpty()) {
                      IconButton(onClick = { vm.updateSearchQuery("") }) {
                        Icon(Icons.Default.Close, contentDescription = "Clear search")
                      }
                    }
                  },
                  shape = RoundedCornerShape(16.dp),
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .testTag("search_input")
                )
              }
            }

            item(key = "hero") {
              HeroSectionCard(
                language = state.language,
                socialChannels = state.socialChannels,
                onSocialClick = { channel -> openSafeUrl(context, channel.url) },
                onWatchVideoClick = { vm.openVideoPreviewNotice(true) }
              )
            }

            item(key = "explore_header") {
              Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                Text(
                  text = if (state.language == AppLanguage.EN) "QUICK NAVIGATION" else "দ্রুত নেভিগেশন",
                  style = MaterialTheme.typography.labelSmall,
                  color = CyberCyan
                )
                Spacer(Modifier.height(4.dp))
                Text(
                  text = if (state.language == AppLanguage.EN) "Explore Resources" else "রিসোর্স এক্সপ্লোর করুন",
                  style = MaterialTheme.typography.headlineMedium
                )
              }
            }

            item(key = "explore_row") {
              LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
              ) {
                items(state.categories, key = { "exp_${it.id}" }) { category ->
                  ExploreTile(
                    category = category,
                    language = state.language,
                    onClick = { vm.openCategory(category) },
                    modifier = Modifier.width(172.dp)
                  )
                }
              }
            }

            item(key = "categories_header") {
              Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                Text(
                  text = if (state.language == AppLanguage.EN) "RESOURCE LIBRARY" else "রিসোর্স লাইব্রেরি",
                  style = MaterialTheme.typography.labelSmall,
                  color = CyberCyan
                )
                Spacer(Modifier.height(4.dp))
                Text(
                  text = if (state.language == AppLanguage.EN) "Developer Categories" else "ডেভেলপার ক্যাটাগরি",
                  style = MaterialTheme.typography.headlineMedium
                )
              }
            }

            if (filteredCategories.isEmpty()) {
              item(key = "empty_search") {
                Surface(
                  shape = RoundedCornerShape(18.dp),
                  color = MaterialTheme.colorScheme.surfaceVariant,
                  border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                ) {
                  Text(
                    text = if (state.language == AppLanguage.EN) {
                      "No matching categories or versions found."
                    } else {
                      "কোনো মিল পাওয়া যায়নি।"
                    },
                    style = MaterialTheme.typography.bodyLarge,
                    modifier = Modifier.padding(24.dp)
                  )
                }
              }
            } else {
              items(filteredCategories, key = { it.id }) { category ->
                CategoryCyberCard(
                  category = category,
                  language = state.language,
                  onViewClick = { vm.openCategory(category) }
                )
              }
            }
          }
        }
      }
    }
  }

  // Version & Resource Links Bottom Sheet Modal
  val selectedCategory = state.selectedCategory
  if (selectedCategory != null) {
    BackHandler {
      if (state.selectedVersion != null) vm.backToVersions() else vm.closeModal()
    }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(
      onDismissRequest = vm::closeModal,
      sheetState = sheetState,
      containerColor = MaterialTheme.colorScheme.surface
    ) {
      val selectedVersion = state.selectedVersion
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .padding(horizontal = 20.dp)
          .navigationBarsPadding()
          .padding(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
      ) {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.weight(1f)
          ) {
            if (selectedVersion != null) {
              IconButton(onClick = vm::backToVersions) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back to versions")
              }
            }
            Text(
              text = buildString {
                append(if (state.language == AppLanguage.EN) selectedCategory.titleEn else selectedCategory.titleBn)
                if (selectedVersion != null) append(" • ${selectedVersion.tag}")
              },
              style = MaterialTheme.typography.titleLarge
            )
          }
          IconButton(onClick = vm::closeModal) {
            Icon(Icons.Default.Close, contentDescription = "Close modal")
          }
        }

        LazyColumn(
          verticalArrangement = Arrangement.spacedBy(12.dp),
          modifier = Modifier.fillMaxWidth()
        ) {
          if (selectedVersion == null) {
            items(selectedCategory.versions, key = { it.id }) { ver ->
              val countKey = "${selectedCategory.id}_${ver.id}"
              val totalDl = ver.baseDownloads + (state.downloadCounts[countKey] ?: 0)
              VersionRowCard(
                version = ver,
                downloads = totalDl,
                language = state.language,
                onViewClick = { vm.openVersion(ver) }
              )
            }
          } else {
            items(selectedVersion.links, key = { it.id }) { link ->
              ResourceLinkCard(
                link = link,
                language = state.language,
                onOpen = { safeUrl ->
                  vm.recordDownloadClick(selectedCategory.id, selectedVersion.id)
                  openSafeUrl(context, safeUrl)
                },
                onCopy = { safeUrl ->
                  copyTextToClipboard(context, safeUrl)
                  scope.launch {
                    snackbarHostState.showSnackbar(
                      if (state.language == AppLanguage.EN) "Link copied to clipboard" else "লিঙ্ক কপি হয়েছে"
                    )
                  }
                },
                onShare = { safeUrl ->
                  shareUrl(context, "${selectedCategory.titleEn} ${selectedVersion.tag}", safeUrl)
                }
              )
            }
          }
        }
      }
    }
  }

  // Community Popup
  if (state.showCommunityDialog) {
    var dontShowAgain by remember { mutableStateOf(false) }
    AlertDialog(
      onDismissRequest = { vm.dismissCommunityDialog(dontShowAgain) },
      title = {
        Text(
          text = if (state.language == AppLanguage.EN) {
            "Join Our Developer Community!"
          } else {
            "আমাদের ডেভেলপার কমিউনিটিতে যোগ দিন।"
          },
          style = MaterialTheme.typography.titleLarge
        )
      },
      text = {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
          Text(
            text = if (state.language == AppLanguage.EN) {
              "আমাদের ডেভেলপার কমিউনিটিতে যোগ দিন।\nGet instant updates on free websites, APK builds, bots, and tutorials."
            } else {
              "Join Our Developer Community!\nনতুন ওয়েবসাইট, APK বিল্ড, বট ও টিউটোরিয়ালের আপডেট পান।"
            },
            style = MaterialTheme.typography.bodyMedium
          )
          Button(
            onClick = { openSafeUrl(context, "https://t.me/") },
            modifier = Modifier.fillMaxWidth().height(48.dp)
          ) {
            Text(if (state.language == AppLanguage.EN) "Join Telegram" else "টেলিগ্রামে যোগ দিন")
          }
          OutlinedButton(
            onClick = { openSafeUrl(context, "https://www.youtube.com/") },
            modifier = Modifier.fillMaxWidth().height(48.dp)
          ) {
            Text(if (state.language == AppLanguage.EN) "Subscribe YouTube" else "ইউটিউব সাবস্ক্রাইব")
          }
          Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
          ) {
            Checkbox(
              checked = dontShowAgain,
              onCheckedChange = { dontShowAgain = it }
            )
            Text(
              text = if (state.language == AppLanguage.EN) "Don't show this again" else "আবার দেখাবেন না",
              style = MaterialTheme.typography.bodyMedium
            )
          }
        }
      },
      confirmButton = {
        TextButton(onClick = { vm.dismissCommunityDialog(dontShowAgain) }) {
          Text(if (state.language == AppLanguage.EN) "Close" else "বন্ধ করুন")
        }
      }
    )
  }

  if (state.showVideoNotice) {
    AlertDialog(
      onDismissRequest = { vm.openVideoPreviewNotice(false) },
      title = { Text("WATCH THIS VIDEO", style = MaterialTheme.typography.titleLarge) },
      text = {
        Text(
          text = if (state.language == AppLanguage.EN) {
            "Connect your featured YouTube URL in Firestore (settings/public.heroVideoUrl) to stream directly inside the showcase player."
          } else {
            "শোকেস প্লেয়ারে ভিডিও চালাতে Firestore-এর settings/public.heroVideoUrl-এ আপনার YouTube লিংক যোগ করুন।"
          }
        )
      },
      confirmButton = {
        TextButton(onClick = { vm.openVideoPreviewNotice(false) }) {
          Text("OK")
        }
      }
    )
  }
}

private fun openSafeUrl(context: Context, rawUrl: String) {
  if (!rawUrl.startsWith("https://") && !rawUrl.startsWith("http://")) return
  val intent = Intent(Intent.ACTION_VIEW, Uri.parse(rawUrl))
  context.startActivity(intent)
}

private fun copyTextToClipboard(context: Context, text: String) {
  val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
  clipboard.setPrimaryClip(ClipData.newPlainText("FAHAD DEV Link", text))
}

private fun shareUrl(context: Context, title: String, url: String) {
  val intent = Intent(Intent.ACTION_SEND).apply {
    type = "text/plain"
    putExtra(Intent.EXTRA_SUBJECT, title)
    putExtra(Intent.EXTRA_TEXT, "$title — $url")
  }
  context.startActivity(Intent.createChooser(intent, title))
}
