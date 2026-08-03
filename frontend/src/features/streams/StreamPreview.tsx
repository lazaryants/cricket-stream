import {
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";

import EditIcon
  from "@mui/icons-material/Edit";

import { Link }
  from "react-router";

import { useI18n } from "../../i18n/useI18n";

import {
  StreamLivePlayer,
} from "./StreamLivePlayer";


interface StreamPreviewProps {
  streamId: number;
  processAlive: boolean;
  editUrl?: string;
}


export function StreamPreview({
  streamId,
  processAlive,
  editUrl,
}: StreamPreviewProps) {
  const { t } = useI18n();

  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: 720,
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1.5}
            sx={{
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },
            }}
          >
            <Stack
              spacing={0.5}
              sx={{ flexGrow: 1 }}
            >
              <Typography variant="h6">
                {t("streamPreview.title")}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {t("streamPreview.subtitle")}
              </Typography>
            </Stack>

            {editUrl && (
              <Button
                component={Link}
                to={editUrl}
                variant="contained"
                startIcon={<EditIcon />}
                sx={{ flexShrink: 0 }}
              >
                {t("common.edit")}
              </Button>
            )}
          </Stack>

          <StreamLivePlayer
            streamId={streamId}
            processAlive={processAlive}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
