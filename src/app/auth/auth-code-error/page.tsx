export default function AuthCodeErrorPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Anmeldung fehlgeschlagen</h1>
      <p className="text-gray-700 mb-4">Es gab ein Problem mit der OAuth-Anmeldung. Bitte versuche es erneut oder kontaktiere den Support.</p>
      <a href="/" className="text-blue-600 underline">Zur Startseite</a>
    </div>
  );
}