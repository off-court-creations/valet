// ─────────────────────────────────────────────────────────────────────────────
// docs/src/pages/components/layout/AccordionConstrainedDemo.tsx  | valet-docs
// Migrated to ComponentMetaPage – constrainHeight usage
// ─────────────────────────────────────────────────────────────────────────────
import { Typography, Accordion, Panel } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import AccordionMeta from '../../../../../src/components/layout/Accordion.meta.json';

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse porta, nunc at egestas mattis, mauris risus iaculis mi, at cursus metus justo quis quam.';

export default function AccordionConstrainedDemo() {
  const usage = (
    <Panel fullWidth>
      <Accordion constrainHeight>
        {Array.from({ length: 8 }, (_, i) => (
          <Accordion.Item
            key={i}
            header={`Item ${i + 1}`}
          >
            <Typography>{LOREM}</Typography>
          </Accordion.Item>
        ))}
      </Accordion>
    </Panel>
  );

  return (
    <ComponentMetaPage
      title='Accordion (Constrained)'
      subtitle='Body scrolls inside the component rather than the page'
      slug='components/layout/accordion'
      meta={AccordionMeta}
      usage={usage}
    />
  );
}
