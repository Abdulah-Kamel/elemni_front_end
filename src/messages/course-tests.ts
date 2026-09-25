// Course-test strings live in their own files (one per screen group) and are
// mounted under the "courseTests" namespace.
import arAttempt from "./course-tests/ar/attempt.json";
import arCommon from "./course-tests/ar/common.json";
import arIntro from "./course-tests/ar/intro.json";
import arResult from "./course-tests/ar/result.json";
import enAttempt from "./course-tests/en/attempt.json";
import enCommon from "./course-tests/en/common.json";
import enIntro from "./course-tests/en/intro.json";
import enResult from "./course-tests/en/result.json";

const messages = {
  ar: { common: arCommon, intro: arIntro, attempt: arAttempt, result: arResult },
  en: { common: enCommon, intro: enIntro, attempt: enAttempt, result: enResult },
};

export function courseTestMessages(locale: string) {
  return messages[locale === "en" ? "en" : "ar"];
}
