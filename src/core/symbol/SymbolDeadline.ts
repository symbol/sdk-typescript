/*
 * Copyright 2018 NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ChronoUnit, Duration, Instant, LocalDateTime, ZoneId } from '@js-joda/core';
/**
 * The deadline of the transaction. The deadline is given as the number of seconds elapsed since the creation of the nemesis block.
 * If a transaction does not get included in a block before the deadline is reached, it is deleted.
 */
export class SymbolDeadline {
    /**
     * Deadline value (without Nemesis epoch adjustment)
     */
    public adjustedValue: number;

    /**
     * Create deadinline.
     * @param {number} epochAdjustment the network's epoch adjustment (seconds). Defined in the network/properties. e.g. 1573430400;
     * @param {number} deadline the deadline unit value.
     * @param {ChronoUnit} chronoUnit the crhono unit. e.g ChronoUnit.HOURS
     * @returns {SymbolDeadline}
     */
    public static create(epochAdjustment: number, deadline: number, chronoUnit: ChronoUnit): SymbolDeadline {
        const deadlineDateTime = Instant.now().plus(deadline, chronoUnit);

        if (deadline <= 0) {
            throw new Error('deadline should be greater than 0');
        }
        return SymbolDeadline.createFromAdjustedValue(deadlineDateTime.minusSeconds(epochAdjustment).toEpochMilli());
    }

    /**
     *
     * Create a Deadline where the adjusted values was externally calculated.
     *
     * @returns {Deadline}
     */
    public static createFromAdjustedValue(adjustedValue: number): SymbolDeadline {
        return new SymbolDeadline(adjustedValue);
    }

    /**
     * Constructor
     * @param adjustedValue Adjusted value. (Local datetime minus nemesis epoch adjustment)
     */
    private constructor(adjustedValue: number) {
        this.adjustedValue = adjustedValue;
    }

    /**
     * Returns deadline as local date time.
     * @param epochAdjustment the network's epoch adjustment (seconds). Defined in the network/properties.
     * @returns {LocalDateTime}
     */
    public toLocalDateTime(epochAdjustment: number): LocalDateTime {
        return this.toLocalDateTimeGivenTimeZone(epochAdjustment, ZoneId.SYSTEM);
    }

    /**
     * Returns deadline as local date time.
     * @param epochAdjustment the network's epoch adjustment (seconds). Defined in the network/properties.
     * @param zoneId the Zone Id.
     * @returns {LocalDateTime}
     */
    public toLocalDateTimeGivenTimeZone(epochAdjustment: number, zoneId: ZoneId): LocalDateTime {
        return LocalDateTime.ofInstant(
            Instant.ofEpochMilli(this.adjustedValue).plusMillis(Duration.ofSeconds(epochAdjustment).toMillis()),
            zoneId,
        );
    }
}
