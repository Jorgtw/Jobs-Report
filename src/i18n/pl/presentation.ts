export const presentation = {
  sidebar: {
    clienti: "Klienci",
    personale: "Personel",
    progetti: "Projekty",
    subappalti: "Podwykonawcy",
    rapportini: "Raporty pracy",
    sommario: "Podsumowanie prac",
    profilo: "Profil",
    assistenza: "Pomoc",
    esci: "Wyjdź"
  },
  hero: {
    tag: "Wartość doświadczenia",
    title: "Raporty i kontrola kosztów w czasie rzeczywistym",
    desc: "Stworzony na podstawie ponad 30-letniego doświadczenia zdobytego bezpośrednio w terenie: najpierw jako pracownik, a potem jako administrator. JobsReport to praktyczne narzędzie zrodzone z realnych potrzeb osób codziennie zarządzających budową."
  },
  ui: {
    key_features: "Kluczowe funkcje",
    request_demo: "Poproś o darmowe demo →",
    footer_rights: "Wszelkie prawa zastrzeżone",
    overlay_title: "Witaj w JobsReport",
    overlay_sub: "Wybierz język, aby rozpocząć prezentację"
  },
  sections: {
    clienti: {
      title: "Klienci",
      desc: "Niezbędny rejestr do zarządzania budowami.",
      groups: [
          {
          title: "Dane firmy",
          items: [
              {
              name: "Podstawowa karta",
              desc: "Nazwa firmy, NIP i kontakty."
            },
              {
              name: "Status klienta",
              desc: "Zarządzaj aktywnymi/nieaktywnymi klientami."
            }
            ]
        }
        ]
    },
    personale: {
      title: "Twój zespół",
      desc: "Zarządzanie i wdrażanie personelu wewnętrznego i zewnętrznego.",
      groups: [
          {
          title: "Role i język",
          items: [
              {
              name: "Wdrożenie",
              desc: "Wyślij instrukcje aplikacji w języku pracownika."
            },
              {
              name: "Role",
              desc: "Pracownik, Brygadzista lub Administrator."
            }
            ]
        }
        ]
    },
    progetti: {
      title: "Projekty",
      desc: "Konfiguracja i monitorowanie budów oraz działań wewnętrznych.",
      groups: [
          {
          title: "Typologia",
          items: [
              {
              name: "Klienci vs Wewnętrzne",
              desc: "Zarządzaj zleceniami lub nieobecnościami."
            },
              {
              name: "Budżet",
              desc: "Wsparcie dla prac godzinowych lub ryczałtowych."
            }
            ]
        }
        ]
    },
    subappalti: {
      title: "Podwykonawcy",
      desc: "Współpracuj z firmami zewnętrznymi, zachowując kontrolę nad kosztami.",
      groups: [
          {
          title: "Partnerzy",
          items: [
              {
              name: "Zarządzanie firmami",
              desc: "Rejestr podwykonawców i kontakty."
            },
              {
              name: "Koszty zewnętrzne",
              desc: "Monitorowanie prac ryczałtowych lub godzinowych."
            }
            ]
        }
        ]
    },
    rapportini: {
      title: "Raporty pracy",
      desc: "Szybkie, precyzyjne i profesjonalne raportowanie dzienne.",
      groups: [
          {
          title: "Wykonanie",
          items: [
              {
              name: "Czas rzeczywisty",
              desc: "Precyzyjne śledzenie początku/końca lub godziny."
            },
              {
              name: "Wydatki",
              desc: "Wprowadzanie posiłków, materiałów i parkingów."
            }
            ]
        },
          {
          title: "Zarządzanie",
          items: [
              {
              name: "Kierownik zespołu",
              desc: "Brygadzista może wpisywać dane dla całego zespołu."
            }
            ]
        }
        ]
    },
    sommario: {
      title: "Analiza ekonomiczna",
      desc: "Podsumowanie prac: serce kontroli marży.",
      groups: [
          {
          title: "Analiza",
          items: [
              {
              name: "Czas rzeczywisty",
              desc: "Marże netto i koszty obliczane błyskawicznie."
            },
              {
              name: "Filtry i eksport",
              desc: "Filtruj i pobieraj dane w formacie Excel lub PDF."
            }
            ]
        }
        ]
    },
    profilo: {
      title: "Twoje konto",
      desc: "Spersonalizuj swoje doświadczenie pracy.",
      groups: [
          {
          title: "Konto",
          items: [
              {
              name: "Bezpieczeństwo",
              desc: "Zarządzanie dostępem i preferencje językowe."
            }
            ]
        }
        ]
    },
    assistenza: {
      title: "Centrum pomocy",
      desc: "Szybkie przewodniki i instrukcje dla optymalnego użycia aplikacji.",
      groups: [
          {
          title: "Szybki start",
          items: [
              {
              name: "Instalacja",
              desc: "Dodaj aplikację do ekranu głównego (iPhone: \"Dodaj do ekranu\", Android: \"Zainstaluj\")."
            },
              {
              name: "Filtry",
              desc: "Użyj \"Podsumowania prac\", aby monitorować marże i koszty w czasie rzeczywistym."
            }
            ]
        },
          {
          title: "Wsparcie",
          items: [
              {
              name: "Admin",
              desc: "W celu uzyskania pomocy technicznej skontaktuj się z administratorem systemu."
            }
            ]
        }
        ]
    }
  }
} as const;
