package com.flexrun.app.data.local

import androidx.room.TypeConverter
import com.flexrun.app.domain.model.RunType
import java.time.Instant

class Converters {
    
    @TypeConverter
    fun fromTimestamp(value: Long?): Instant? {
        return value?.let { Instant.ofEpochMilli(it) }
    }

    @TypeConverter
    fun instantToTimestamp(instant: Instant?): Long? {
        return instant?.toEpochMilli()
    }

    @TypeConverter
    fun fromRunType(value: RunType): String {
        return value.name
    }

    @TypeConverter
    fun toRunType(value: String): RunType {
        return RunType.valueOf(value)
    }
}
