import { Surface, Stack, Button, Box, Typography } from "@archway/valet";
import { useNavigate } from "react-router-dom";

export default function QuickstartPage() {
  const navigate = useNavigate();
  return (
    <Surface>
      <Box alignX="center" centerContent>
        <Stack>
          <Typography>Welcome to Valet</Typography>
          <Button onClick={() => navigate("/secondpage")}>
            Go to the other page
          </Button>
        </Stack>
      </Box>
    </Surface>
  );
}
