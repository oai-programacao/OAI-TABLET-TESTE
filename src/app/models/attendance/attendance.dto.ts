export interface Media {
  id: string;
  nameFile: string;
  urlFile: string;
  typeFile?: string; 
  dataUpload: string;
}

export interface Attendance {
  id: string;
  clientName: string;
  sellerName: string;
  openDate: string;        
  openHour: string;        
  initiative: string;
  mode: string;
  typeClient: string;
  contract: string;
  flow: string;
  type: string;
  topic: string;
  subject: string;
  codeAttendanceRbx: number;

  medias?: Media[]; 
}