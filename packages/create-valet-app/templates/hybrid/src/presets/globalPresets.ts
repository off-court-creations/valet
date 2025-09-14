import { definePreset } from "@archway/valet";

definePreset(
  "fancyHolder",
  (t) => `
    background   : ${t.colors["primary"]};
    color        : ${t.colors["primaryText"]};
    border-radius: 20px;
    box-shadow   : 0 6px 16px ${t.colors["text"]}22;
    padding      : ${t.spacing(1)};
    margin       : ${t.spacing(1)};
  `,
);

definePreset(
  "glassHolder",
  (t) => `
    background      : ${t.colors["background"]}CC;
    backdrop-filter : blur(6px) saturate(180%);
    border          : 1px solid ${t.colors["text"]}22;
    padding         : ${t.spacing(1)};
    border-radius   : 12px;
  `,
);

definePreset(
  "frostedGlass",
  (t) => `
    background           : ${t.colors["background"]}B3;
    -webkit-backdrop-filter: blur(10px) saturate(160%);
    backdrop-filter      : blur(10px) saturate(160%);
    border               : 1px solid ${t.colors["text"]}22;
    border-radius        : 14px;
    padding              : ${t.spacing(1)};
  `,
);

definePreset(
  "gradientHolder",
  () => `
    background: linear-gradient(135deg,#ff6b6b 0%,#f7b267 50%,#4bd0d2 100%);
    color     : #ffffff;
    padding   : 32px;
    border-radius: 8px;
    text-align: center;
  `,
);

definePreset(
  "codePanel",
  (t) => `
    padding      : ${t.spacing(1)};
    margin-bottom: ${t.spacing(4)} !important;
  `,
);
