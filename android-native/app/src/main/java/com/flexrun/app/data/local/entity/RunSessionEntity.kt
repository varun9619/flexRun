package com.flexrun.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.flexrun.app.domain.model.RunType
import java.time.Instant

@Entity(tableName = "run_sessions")
data class RunSessionEntity(
    @PrimaryKey
    val id: String,
    val runType: RunType,
    val startTime: Instant,
    val endTime: Instant?,
    val distanceKm: Float,
    val durationMs: Long,
    val averagePaceSecondsPerKm: Int,
    val bestPaceSecondsPerKm: Int?,
    val elevationGainM: Float?,
    val caloriesBurned: Int?,
    val perceivedEffort: Int?, // 1-4 scale
    val routePolyline: String?, // Encoded polyline
    val notes: String?,
    val createdAt: Instant
)
