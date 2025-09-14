import {
  Surface,
  Stack,
  Button,
  Box,
  Typography,
  Accordion,
} from "@archway/valet";
import { useNavigate } from "react-router-dom";

export default function SecondPage() {
  const navigate = useNavigate();
  return (
    <Surface>
      <Box alignX="center" centerContent>
        <Stack sx={{ gap: "1rem", width: "min(900px, 100%)" }}>
          <Typography variant="h2">Welcome to Valet again!</Typography>

          <Accordion defaultOpen={0}>
            <Accordion.Item header="Option A">
              Lorem ipsum dolor sit amet.
            </Accordion.Item>
            <Accordion.Item header="Option B">
              Lorem ipsum dolor sit amet.
            </Accordion.Item>
            <Accordion.Item header="Option C">
              Lorem ipsum dolor sit amet.
            </Accordion.Item>
            <Accordion.Item header="Option D">
              Lorem ipsum dolor sit amet.
            </Accordion.Item>
          </Accordion>

          <Button variant="outlined" onClick={() => navigate("/")}>
            Go to the first page
          </Button>
        </Stack>
      </Box>
    </Surface>
  );
}
