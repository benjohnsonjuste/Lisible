// components/Contact.js
import Link from "next/link";
import Image from "next/image";

export default function Contact() {
  return (
    <div className="bg-gray-50 py-8">
      <div className="container mx-auto px-4 text-center">
        {/* Titre */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Contactez-nous
        </h2>

        {/* Section avec les icônes */}
        <div className="flex justify-center space-x-10">
          {/* WhatsApp */}
          <Link
            href="https://wa.me/50948321317"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact WhatsApp"
          >
            <div className="flex flex-col items-center group">
              <Image
                src="/whatsapp-11.svg"
                alt="WhatsApp"
                width={50}
                height={50}
                className="group-hover:scale-110 transition-transform duration-200"
              />
              <span className="text-sm text-gray-600 mt-2 group-hover:text-green-600">
                WhatsApp
              </span>
            </div>
          </Link>

          {/* Facebook Messenger */}
          <Link
            href="https://m.me/LaBelleLitteraire?mibextid=ZbWKwL"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact Messenger"
          >
            <div className="flex flex-col items-center group">
              <Image
                src="/messenger-19.svg"
                alt="Messenger"
                width={50}
                height={50}
                className="group-hover:scale-110 transition-transform duration-200"
              />
              <span className="text-sm text-gray-600 mt-2 group-hover:text-blue-600">
                Messenger
              </span>
            </div>
          </Link>

          {/* E-mail */}
          <Link
            href="mailto:cmo.lablitteraire7@gmail.com"
            aria-label="Contact par e-mail"
          >
            <div className="flex flex-col items-center group">
              <Image
                src="/email-115.svg"
                alt="E-mail"
                width={50}
                height={50}
                className="group-hover:scale-110 transition-transform duration-200"
              />
              <span className="text-sm text-gray-600 mt-2 group-hover:text-red-600">
                E-mail
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}