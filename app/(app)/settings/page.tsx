"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { PageHeading } from "@/components/PageHeading";
import {
  getSettings,
  saveSettings,
  clearAllData,
  DEFAULT_SETTINGS,
} from "@/lib/db/settings";
import {
  DEFAULT_DRAFTING_STYLE,
  DEFAULT_MAPPING_RULES,
} from "@/lib/rules-engine/defaults";
import defaultRedactionRules from "@/lib/redaction/rules.json";
import { parseRules } from "@/lib/redaction/redact";
import type { Level, Settings } from "@/lib/types";

const DEFAULT_REDACTION_JSON = JSON.stringify(defaultRedactionRules, null, 2);

export default function SettingsPage() {
  const [loaded, setLoaded] = useState(false);
  const [level, setLevel] = useState<Level>("core");
  const [model, setModel] = useState<Settings["model"]>("gpt-4o-mini");
  const [exportFormat, setExportFormat] = useState<Settings["exportFormat"]>("md");

  const [mappingRules, setMappingRules] = useState(DEFAULT_MAPPING_RULES);
  const [draftingStyle, setDraftingStyle] = useState(DEFAULT_DRAFTING_STYLE);
  const [redactionRules, setRedactionRules] = useState(DEFAULT_REDACTION_JSON);

  const [rulesMsg, setRulesMsg] = useState<string | undefined>();
  const [rulesError, setRulesError] = useState<string | undefined>();
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const s = await getSettings();
      if (!active) return;
      setLevel(s.level);
      setModel(s.model);
      setExportFormat(s.exportFormat);
      setMappingRules(s.overrides?.mappingRules ?? DEFAULT_MAPPING_RULES);
      setDraftingStyle(s.overrides?.draftingStyle ?? DEFAULT_DRAFTING_STYLE);
      setRedactionRules(s.overrides?.redactionRules ?? DEFAULT_REDACTION_JSON);
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function savePref(patch: Partial<Settings>) {
    await saveSettings(patch);
  }

  async function saveRules() {
    setRulesError(undefined);
    setRulesMsg(undefined);
    if (!parseRules(redactionRules)) {
      setRulesError("Redaction rules are not valid JSON with a 'rules' array.");
      return;
    }
    await saveSettings({
      overrides: {
        mappingRules: mappingRules.trim(),
        draftingStyle: draftingStyle.trim(),
        redactionRules: redactionRules.trim(),
      },
    });
    setRulesMsg("Saved. New requests use these rules — no redeploy needed.");
    window.setTimeout(() => setRulesMsg(undefined), 2500);
  }

  async function clearData() {
    if (!window.confirm("Clear ALL local data (entries, settings, drafts)? This cannot be undone.")) {
      return;
    }
    await clearAllData();
    setLevel(DEFAULT_SETTINGS.level);
    setModel(DEFAULT_SETTINGS.model);
    setExportFormat(DEFAULT_SETTINGS.exportFormat);
    setMappingRules(DEFAULT_MAPPING_RULES);
    setDraftingStyle(DEFAULT_DRAFTING_STYLE);
    setRedactionRules(DEFAULT_REDACTION_JSON);
    setCleared(true);
    window.setTimeout(() => setCleared(false), 2500);
  }

  if (!loaded) {
    return (
      <div>
        <PageHeading eyebrow="Settings" title="Settings & rules" />
        <p className="font-ui text-[0.875rem] text-ink-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <PageHeading eyebrow="Settings" title="Settings & rules">
        Tune behaviour. Rules are sent with each mapping request — change them
        without redeploying.
      </PageHeading>

      {/* Preferences */}
      <section className="space-y-5">
        <Segmented
          label="Training level"
          options={[
            { value: "core", label: "Core" },
            { value: "specialty", label: "Specialty" },
          ]}
          value={level}
          onChange={(v) => {
            setLevel(v as Level);
            void savePref({ level: v as Level });
          }}
        />
        <Segmented
          label="Model"
          options={[
            { value: "gpt-4o-mini", label: "gpt-4o-mini" },
            { value: "gpt-4o", label: "gpt-4o" },
          ]}
          value={model}
          onChange={(v) => {
            setModel(v as Settings["model"]);
            void savePref({ model: v as Settings["model"] });
          }}
        />
        <Segmented
          label="Default export format"
          options={[
            { value: "md", label: ".md" },
            { value: "json", label: ".json" },
          ]}
          value={exportFormat}
          onChange={(v) => {
            setExportFormat(v as Settings["exportFormat"]);
            void savePref({ exportFormat: v as Settings["exportFormat"] });
          }}
        />
      </section>

      {/* Rules editor */}
      <section className="mt-10 space-y-6">
        <h2 className="font-ui uppercase text-[0.6875rem] tracking-[0.12em] text-ink-muted">
          Rules editor
        </h2>
        <RuleEditor
          label="Mapping rules"
          value={mappingRules}
          onChange={setMappingRules}
          onReset={() => setMappingRules(DEFAULT_MAPPING_RULES)}
        />
        <RuleEditor
          label="Drafting style"
          value={draftingStyle}
          onChange={setDraftingStyle}
          onReset={() => setDraftingStyle(DEFAULT_DRAFTING_STYLE)}
        />
        <RuleEditor
          label="Redaction rules (JSON)"
          value={redactionRules}
          onChange={setRedactionRules}
          onReset={() => setRedactionRules(DEFAULT_REDACTION_JSON)}
          mono
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void saveRules()}>Save rules</Button>
          {rulesMsg ? (
            <span className="font-ui text-[0.75rem] text-ink-muted">{rulesMsg}</span>
          ) : null}
        </div>
        {rulesError ? (
          <p
            role="alert"
            className="border border-ink bg-inverse-bg p-3 font-ui text-[0.8125rem] text-paper"
          >
            {rulesError}
          </p>
        ) : null}
      </section>

      {/* Danger zone */}
      <section className="mt-12 border border-ink p-4">
        <h2 className="font-ui uppercase text-[0.6875rem] tracking-[0.12em] text-ink-muted">
          Local data
        </h2>
        <p className="mt-2 max-w-xl font-typed text-[0.875rem] text-ink-muted">
          Everything lives only in this browser. Clearing wipes all entries,
          settings and drafts.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="ghost" onClick={() => void clearData()}>
            Clear all local data
          </Button>
          {cleared ? (
            <span className="font-ui text-[0.75rem] text-ink-muted">Cleared.</span>
          ) : null}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-4 border-t border-rule-faint pt-4">
        <a
          href="/privacy"
          className="font-ui text-[0.6875rem] uppercase tracking-[0.12em] text-ink-muted underline underline-offset-4 hover:text-ink"
        >
          Privacy statement →
        </a>
      </div>
    </div>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="font-ui uppercase text-[0.625rem] tracking-[0.12em] text-ink-muted">
        {label}
      </p>
      <div className="mt-2 inline-flex border border-ink">
        {options.map((o, i) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={`px-4 py-2 font-ui text-[0.75rem] uppercase tracking-[0.08em] ${
              i > 0 ? "border-l border-ink" : ""
            } ${value === o.value ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-ink/5"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RuleEditor({
  label,
  value,
  onChange,
  onReset,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="font-ui uppercase text-[0.625rem] tracking-[0.12em] text-ink-muted">
          {label}
        </label>
        <button
          type="button"
          onClick={onReset}
          className="font-ui text-[0.625rem] uppercase tracking-[0.1em] text-ink-muted hover:text-ink"
        >
          Reset to default
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={mono ? 12 : 8}
        spellCheck={!mono}
        className={`mt-1 w-full resize-y border border-ink bg-paper p-3 text-[0.8125rem] leading-[1.5] text-ink focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${
          mono ? "font-ui" : "font-typed"
        }`}
      />
    </div>
  );
}
