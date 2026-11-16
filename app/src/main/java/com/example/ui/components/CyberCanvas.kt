package com.example.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.example.ui.theme.CyberCyan
import com.example.ui.theme.CyberPrimary
import com.example.ui.theme.CyberPrimaryGlow
import com.example.ui.theme.CyberViolet
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

private data class StarParticle(
  val xNorm: Float,
  val yNorm: Float,
  val radius: Float,
  val speed: Float,
  val color: Color,
  val phase: Float
)

@Composable
fun Cyber3DBackground(
  isDark: Boolean,
  modifier: Modifier = Modifier
) {
  val particles = remember {
    val rnd = Random(2026)
    val palette = listOf(CyberPrimary, CyberPrimaryGlow, CyberViolet, CyberCyan)
    List(48) { idx ->
      StarParticle(
        xNorm = rnd.nextFloat(),
        yNorm = rnd.nextFloat(),
        radius = 2f + rnd.nextFloat() * 4.5f,
        speed = 0.2f + rnd.nextFloat() * 0.6f,
        color = palette[idx % palette.size],
        phase = rnd.nextFloat() * (2f * PI.toFloat())
      )
    }
  }

  val transition = rememberInfiniteTransition(label = "cyber3d")
  val angle by transition.animateFloat(
    initialValue = 0f,
    targetValue = 2f * PI.toFloat(),
    animationSpec = infiniteRepeatable(
      animation = tween(durationMillis = 16000, easing = LinearEasing),
      repeatMode = RepeatMode.Restart
    ),
    label = "angle"
  )

  Canvas(modifier = modifier.fillMaxSize()) {
    val w = size.width
    val h = size.height

    // Subtle cyber background grid
    val gridStep = 96f
    val gridColor = if (isDark) CyberPrimary.copy(alpha = 0.08f) else CyberPrimary.copy(alpha = 0.06f)
    var gx = 0f
    while (gx < w) {
      drawLine(gridColor, Offset(gx, 0f), Offset(gx, h), strokeWidth = 1f)
      gx += gridStep
    }
    var gy = 0f
    while (gy < h) {
      drawLine(gridColor, Offset(0f, gy), Offset(w, gy), strokeWidth = 1f)
      gy += gridStep
    }

    // Ambient radial glows
    drawCircle(
      brush = Brush.radialGradient(
        colors = listOf(CyberPrimary.copy(alpha = if (isDark) 0.22f else 0.12f), Color.Transparent),
        center = Offset(w * 0.18f, h * 0.15f),
        radius = w * 0.65f
      ),
      center = Offset(w * 0.18f, h * 0.15f),
      radius = w * 0.65f
    )
    drawCircle(
      brush = Brush.radialGradient(
        colors = listOf(CyberViolet.copy(alpha = if (isDark) 0.20f else 0.10f), Color.Transparent),
        center = Offset(w * 0.85f, h * 0.72f),
        radius = w * 0.6f
      ),
      center = Offset(w * 0.85f, h * 0.72f),
      radius = w * 0.6f
    )

    // Floating cyber particles
    particles.forEach { p ->
      val driftY = (p.yNorm + angle * p.speed * 0.04f) % 1f
      val driftX = p.xNorm + sin(angle + p.phase) * 0.025f
      drawCircle(
        color = p.color.copy(alpha = if (isDark) 0.55f else 0.35f),
        radius = p.radius,
        center = Offset(driftX * w, driftY * h)
      )
    }

    // 3D Projected Wireframe Octahedron in upper-right space
    val centerX = w * 0.80f
    val centerY = h * 0.20f + sin(angle * 2f) * 18f
    val scale = (w.coerceAtMost(h)) * 0.14f

    val vertices = listOf(
      floatArrayOf(0f, -1.25f, 0f),
      floatArrayOf(1f, 0f, 0f),
      floatArrayOf(0f, 0f, 1f),
      floatArrayOf(-1f, 0f, 0f),
      floatArrayOf(0f, 0f, -1f),
      floatArrayOf(0f, 1.25f, 0f)
    )

    val cosA = cos(angle)
    val sinA = sin(angle)
    val cosB = cos(angle * 0.6f)
    val sinB = sin(angle * 0.6f)

    val projected = vertices.map { v ->
      // Rotate Y then X
      val x1 = v[0] * cosA - v[2] * sinA
      val z1 = v[0] * sinA + v[2] * cosA
      val y2 = v[1] * cosB - z1 * sinB
      val z2 = v[1] * sinB + z1 * cosB
      val persp = 3.2f / (3.2f - z2)
      Offset(centerX + x1 * scale * persp, centerY + y2 * scale * persp)
    }

    val edges = listOf(
      0 to 1, 0 to 2, 0 to 3, 0 to 4,
      5 to 1, 5 to 2, 5 to 3, 5 to 4,
      1 to 2, 2 to 3, 3 to 4, 4 to 1
    )

    val wireColor = CyberCyan.copy(alpha = if (isDark) 0.38f else 0.28f)
    edges.forEach { (a, b) ->
      drawLine(wireColor, projected[a], projected[b], strokeWidth = 2f)
    }
  }
}
