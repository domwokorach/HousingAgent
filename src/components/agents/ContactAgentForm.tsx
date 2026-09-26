"use client";

import { useId, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { sendEnquiry } from "@/services/agent.service";
import type { Agent } from "@/types/agent";
import { validate } from "@/validation";
import { enquirySchema } from "@/validation/agent.schema";
import { IconCheck, IconMail, IconPhone } from "@/components/ui/Icons";
import { Alert, Button, Field, Input, Textarea } from "@/components/ui";

export function ContactAgentForm({
  agent,
  propertyId,
  propertyTitle,
}: {
  agent: Agent;
  propertyId?: string;
  propertyTitle?: string;
}) {
  const id = useId();
  const { hydrated, user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(
    propertyTitle
      ? `Hello, I'd like to arrange a viewing of "${propertyTitle}". Could you let me know what times you have available?`
      : "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);

  // Prefill from the signed-in account once storage has been read. Adjusting
  // state during render avoids a syncing effect and an extra paint.
  if (hydrated && user && prefilledFor !== user.email) {
    setPrefilledFor(user.email);
    setName((current) => current || `${user.firstName} ${user.lastName}`);
    setEmail((current) => current || user.email);
    setPhone((current) => current || user.phone);
  }

  if (sent) {
    return (
      <Alert tone="success">
        <p className="flex items-center gap-2 font-medium">
          <IconCheck className="size-5 shrink-0" />
          Your enquiry has been sent to {agent.name} at {agent.agency}.
        </p>
        <p className="mt-1.5">
          They usually reply within one working day. A copy is in your account under
          enquiries.
        </p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </Alert>
    );
  }

  const handleSubmit = async () => {
    const draft = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      message: message.trim(),
      agentId: agent.id,
      propertyId,
    };

    const parsed = validate(enquirySchema, draft);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }

    setSending(true);
    try {
      const result = await sendEnquiry(draft);
      if (!result.ok) {
        setErrors({ [result.field ?? "form"]: result.error });
        return;
      }
      setErrors({});
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  const clearError = (key: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      delete next.form;
      return next;
    });

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      {errors.form && <Alert>{errors.form}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor={`${id}-name`} required error={errors.name}>
          <Input
            id={`${id}-name`}
            value={name}
            autoComplete="name"
            invalid={Boolean(errors.name)}
            onChange={(event) => {
              setName(event.target.value);
              clearError("name");
            }}
          />
        </Field>

        <Field label="Email address" htmlFor={`${id}-email`} required error={errors.email}>
          <Input
            id={`${id}-email`}
            type="email"
            value={email}
            autoComplete="email"
            invalid={Boolean(errors.email)}
            onChange={(event) => {
              setEmail(event.target.value);
              clearError("email");
            }}
          />
        </Field>
      </div>

      <Field
        label="Phone number"
        htmlFor={`${id}-phone`}
        hint="Optional — helpful if you'd like a call back."
        error={errors.phone}
      >
        <Input
          id={`${id}-phone`}
          type="tel"
          value={phone}
          autoComplete="tel"
          invalid={Boolean(errors.phone)}
          onChange={(event) => {
            setPhone(event.target.value);
            clearError("phone");
          }}
        />
      </Field>

      <Field label="Message" htmlFor={`${id}-message`} required error={errors.message}>
        <Textarea
          id={`${id}-message`}
          rows={5}
          value={message}
          invalid={Boolean(errors.message)}
          onChange={(event) => {
            setMessage(event.target.value);
            clearError("message");
          }}
        />
      </Field>

      <Button type="submit" size="lg" loading={sending}>
        Contact Agent
      </Button>

      <div className="flex flex-wrap gap-4 text-sm text-ink-muted">
        <a
          href={`tel:${agent.phone.replace(/\s/g, "")}`}
          className="flex items-center gap-1.5 hover:text-link-hover"
        >
          <IconPhone className="size-4" />
          {agent.phone}
        </a>
        <a
          href={`mailto:${agent.email}`}
          className="flex items-center gap-1.5 hover:text-link-hover"
        >
          <IconMail className="size-4" />
          {agent.email}
        </a>
      </div>
    </form>
  );
}
