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
                Предпросмотр трансляции
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Живое HLS-видео без
                перекодирования. Полный экран
                доступен в панели плеера.
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
                Редактировать
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
