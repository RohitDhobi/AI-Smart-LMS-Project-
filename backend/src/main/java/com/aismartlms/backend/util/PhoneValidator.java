package com.aismartlms.backend.util;

/**
 * Shared phone-number validation for endpoints that accept a phone value.
 *
 * Mirrors the frontend rules in src/utils/phone.js:
 *  - null / blank is allowed (the phone field is optional)
 *  - otherwise only digits, '+', '-' and spaces are accepted
 *  - and the value must contain 7 to 15 digits (E.164 allows at most 15)
 */
public final class PhoneValidator {

    /** Rejection message, same wording as the frontend. */
    public static final String INVALID_MESSAGE =
            "Invalid phone number: enter 7-15 digits, optionally starting with +";

    private PhoneValidator() {
    }

    /**
     * @param phone the raw phone value (may be null)
     * @return null when the value is acceptable, otherwise the error message
     */
    public static String errorOrNull(String phone) {
        if (phone == null || phone.isBlank()) {
            return null; // phone is optional
        }
        if (!phone.matches("[0-9+\\- ]+")) {
            return INVALID_MESSAGE;
        }
        String digits = phone.replaceAll("\\D", "");
        if (digits.length() < 7 || digits.length() > 15) {
            return INVALID_MESSAGE;
        }
        return null;
    }
}
