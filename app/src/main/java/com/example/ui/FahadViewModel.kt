package com.example.ui

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import com.example.model.AppLanguage
import com.example.model.DevCategory
import com.example.model.SeedCatalog
import com.example.model.SocialChannel
import com.example.model.VersionItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

data class FahadUiState(
  val isDarkTheme: Boolean = true,
  val language: AppLanguage = AppLanguage.EN,
  val isSearchVisible: Boolean = false,
  val searchQuery: String = "",
  val categories: List<DevCategory> = SeedCatalog.categories,
  val socialChannels: List<SocialChannel> = SeedCatalog.socialChannels,
  val selectedCategory: DevCategory? = null,
  val selectedVersion: VersionItem? = null,
  val downloadCounts: Map<String, Int> = emptyMap(),
  val showCommunityDialog: Boolean = false,
  val showVideoNotice: Boolean = false
)

class FahadViewModel(application: Application) : AndroidViewModel(application) {
  private val prefs = application.getSharedPreferences("fahad_dev_prefs", Context.MODE_PRIVATE)

  private val _uiState = MutableStateFlow(
    FahadUiState(
      isDarkTheme = prefs.getBoolean("dark_theme", true),
      language = if (prefs.getString("lang", "EN") == "BN") AppLanguage.BN else AppLanguage.EN,
      showCommunityDialog = !prefs.getBoolean("community_dismissed", false)
    )
  )
  val uiState: StateFlow<FahadUiState> = _uiState.asStateFlow()

  fun toggleTheme() {
    _uiState.update { state ->
      val next = !state.isDarkTheme
      prefs.edit().putBoolean("dark_theme", next).apply()
      state.copy(isDarkTheme = next)
    }
  }

  fun toggleLanguage() {
    _uiState.update { state ->
      val next = if (state.language == AppLanguage.EN) AppLanguage.BN else AppLanguage.EN
      prefs.edit().putString("lang", next.name).apply()
      state.copy(language = next)
    }
  }

  fun toggleSearch() {
    _uiState.update { state ->
      val next = !state.isSearchVisible
      state.copy(
        isSearchVisible = next,
        searchQuery = if (!next) "" else state.searchQuery
      )
    }
  }

  fun updateSearchQuery(query: String) {
    _uiState.update { it.copy(searchQuery = query) }
  }

  fun openCategory(category: DevCategory) {
    _uiState.update { it.copy(selectedCategory = category, selectedVersion = null) }
  }

  fun openVersion(version: VersionItem) {
    _uiState.update { it.copy(selectedVersion = version) }
  }

  fun backToVersions() {
    _uiState.update { it.copy(selectedVersion = null) }
  }

  fun closeModal() {
    _uiState.update { it.copy(selectedCategory = null, selectedVersion = null) }
  }

  fun dismissCommunityDialog(dontShowAgain: Boolean) {
    if (dontShowAgain) {
      prefs.edit().putBoolean("community_dismissed", true).apply()
    }
    _uiState.update { it.copy(showCommunityDialog = false) }
  }

  fun recordDownloadClick(categoryId: String, versionId: String) {
    val key = "${categoryId}_$versionId"
    _uiState.update { state ->
      val current = state.downloadCounts[key] ?: 0
      state.copy(downloadCounts = state.downloadCounts + (key to current + 1))
    }
  }

  fun openVideoPreviewNotice(show: Boolean) {
    _uiState.update { it.copy(showVideoNotice = show) }
  }
}
