package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
  primary = CyberPrimary,
  onPrimary = Color.White,
  secondary = CyberViolet,
  onSecondary = Color.White,
  tertiary = CyberCyan,
  onTertiary = CyberBg,
  background = CyberBg,
  onBackground = CyberText,
  surface = CyberBg2,
  onSurface = CyberText,
  surfaceVariant = CyberCard,
  onSurfaceVariant = CyberMuted,
  outline = CyberBorder
)

private val LightColorScheme = lightColorScheme(
  primary = CyberPrimary,
  onPrimary = Color.White,
  secondary = CyberViolet,
  onSecondary = Color.White,
  tertiary = CyberCyan,
  onTertiary = Color.White,
  background = LightBg,
  onBackground = LightText,
  surface = LightBg2,
  onSurface = LightText,
  surfaceVariant = LightCard,
  onSurfaceVariant = LightMuted,
  outline = LightBorder
)

@Composable
fun FahadDevTheme(
  darkTheme: Boolean = true,
  content: @Composable () -> Unit
) {
  val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
  MaterialTheme(
    colorScheme = colorScheme,
    typography = AppTypography,
    content = content
  )
}
