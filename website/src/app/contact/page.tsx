import ContactForm from "./ContactForm";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-3xl text-ink">Contact</h1>
      <p className="mt-4 text-ink-muted">
        {email ? (
          <>
            Reach the CampusEduX team at{" "}
            <a className="text-ink underline" href={`mailto:${email}`}>
              {email}
            </a>
            , or use the form below.
          </>
        ) : (
          "Send us a message with the form below."
        )}
      </p>

      <ContactForm />
    </div>
  );
}
