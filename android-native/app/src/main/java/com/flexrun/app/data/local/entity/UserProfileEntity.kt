package com.flexrun.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "user_profile")
data class UserProfileEntity(
    @PrimaryKey
    val id: String,
    val name: String?,
    val age: Int?,
    val weightKg: Float?,
    val runningGoal: String, // 5K, 10K, HALF_MARATHON, MARATHON, GENERAL_FITNESS
    val experienceLevel: String, // BEGINNER, INTERMEDIATE, EXPERIENCED, RETURNING
    val preferredUnits: String, // KILOMETERS, MILES
    val daysPerWeek: Int,
    val isOnboardingComplete: Boolean
)
