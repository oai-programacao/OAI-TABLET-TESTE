export interface Media {
  id: string;
  nameFile: string;
  urlFile: string;
  typeFile?: string; 
  dataUpload: string;
}

export interface Attendance {
  id: string;
  status: string;
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
  solution: string;
  codeAttendanceRbx: number;

  medias?: Media[]; 
}