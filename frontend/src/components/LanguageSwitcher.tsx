import LanguageIcon
  from "@mui/icons-material/Language";

import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";

import {
  useI18n,
} from "../i18n/useI18n";

import type {
  Language,
} from "../i18n/translations";

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({
  compact = false,
}: LanguageSwitcherProps) {
  const {
    language,
    setLanguage,
    t,
  } = useI18n();

  return (
    <Tooltip
      title={t("language.switch")}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <LanguageIcon
          fontSize={
            compact
              ? "small"
              : "medium"
          }
          color="action"
        />

        <ToggleButtonGroup
          exclusive
          size="small"
          value={language}
          aria-label={
            t("language.switch")
          }
          onChange={(
            _event,
            nextLanguage:
              Language | null,
          ) => {
            if (nextLanguage) {
              setLanguage(
                nextLanguage,
              );
            }
          }}
          sx={{
            "& .MuiToggleButton-root": {
              minWidth: compact
                ? 38
                : 42,
              px: compact
                ? 0.75
                : 1,
              py: 0.35,
              fontSize: compact
                ? "0.72rem"
                : "0.75rem",
              fontWeight: 700,
            },
          }}
        >
          <ToggleButton
            value="en"
            aria-label={
              t("language.english")
            }
          >
            EN
          </ToggleButton>

          <ToggleButton
            value="ru"
            aria-label={
              t("language.russian")
            }
          >
            RU
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Tooltip>
  );
}
