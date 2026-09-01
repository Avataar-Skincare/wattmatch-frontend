export interface ContactFormData {
  email: string;
}

export interface GeneratorRegistrationFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  state: string;
  capacity: string;
  siteLocation: string;
  commissioningTimeline: string;
  certifications: string;
  message: string;
}

export interface CIRegistrationFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  state: string;
  load: string;
  siteLocation: string;
  targetCapacity: string;
  tenurePreference: string;
  message: string;
  consent: boolean;
}
