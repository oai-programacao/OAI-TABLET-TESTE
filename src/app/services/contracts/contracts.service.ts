import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ActiveRequestContract, ActiveResponseContract, Contract, ContractResponseUpdateSituation, RequestCancelContractSuspendDTO, RequestContractSuspendDTO, RequestDateTransfer } from '../../models/contract/contract.dto';
import { ContractSuspenseDTO } from '../../models/contract/contractSuspense.dto';
import { CancelSimulationDTO } from '../../models/contract/cancel-contract.dto';
import { DateUtilsService } from '../../shared/utils/date.utils';

@Injectable({
  providedIn: 'root',
})
export class ContractsService {
  private readonly urlApi = environment.apiUrl;
  private readonly http = inject(HttpClient);

  suspendContract(contractId: string, dto: RequestContractSuspendDTO): Observable<ContractResponseUpdateSituation> {
    return this.http.post<ContractResponseUpdateSituation>(
      `${this.urlApi}/contract/${contractId}/temporary-suspension`,
      dto
    );
  }

  activateContract(contractId: string, dto: ActiveRequestContract) {
    return this.http.post<ActiveResponseContract>(
      `${this.urlApi}/contract/${contractId}/activate`,
      dto
    );
  }

  cancelSuspendContract(contractId: string, dto: RequestCancelContractSuspendDTO): Observable<ContractResponseUpdateSituation> {
    return this.http.post<ContractResponseUpdateSituation>(
      `${this.urlApi}/contract/${contractId}/cancel-temporary-suspension`,
      dto
    );
  }

  getContractSuspenseById(contractId: string): Observable<ContractSuspenseDTO> {
    return this.http.get<ContractSuspenseDTO>(
      `${this.urlApi}/contract/contract-suspense/${contractId}`
    );
  }
  private readonly dateUtils = inject(DateUtilsService);

  getContractsActivesByClient(clientId: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(
      `${this.urlApi}/contract/${clientId}/actives`
    );
  }

  getContractsActivesAndWaitByClient(clientId: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(
      `${this.urlApi}/contract/${clientId}/actives-waiting`
    );
  }

  getAllContractsByClient(clientId: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.urlApi}/contract/${clientId}/all`);
  }

  getContractsBlockedsByClient(clientId: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(
      `${this.urlApi}/contract/${clientId}/blockeds`
    );
  }

  getContractsTransfersByClient(clientId: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(
      `${this.urlApi}/contract/${clientId}/transfers`
    );
  }

  upgradeContract(contractId: string, payload: any): Observable<any> {
    return this.http.patch(
      `${this.urlApi}/contract/${contractId}/upgrade`,
      payload
    );
  }

  getContractById(contractId: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.urlApi}/contract/${contractId}`);
  }

  changeBillingDate(payload: {
    clientId: string;
    contractNumber: string;
    billingCycleLabel: string;
    sellerId: string;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.urlApi}/automation/billing-date`,
      payload
    );
  }

  transferOwnership(
    oldContractId: string,
    payloadWhats: any
  ): Observable<any> {
    const url = `${this.urlApi}/contract/${oldContractId}/transfer-ownership`;
    const payload = payloadWhats;

    return this.http.post<any>(url, payload);
  }

  completeDateTransfer(payload: RequestDateTransfer): Observable<any> {
    return this.http.post<any>(
      `${this.urlApi}/contract/complete-date-transfer`,
      payload
    );
  }

  getTransferConsentPdf(
    oldContractId: string,
    newClientId: string
  ): Observable<Blob> {
    const payload = {
      oldContractId: oldContractId,
      newClientId: newClientId,
    };

    const endpoint = `${this.urlApi}/consent-term/generate-transfer-term`;
    return this.http.post(endpoint, payload, {
      responseType: 'blob',
    });
  }

  finalizeAndSignTransfer(payload: any): Observable<Blob> {
    const endpoint = `${this.urlApi}/consent-term/finalize-transfer`;

    return this.http.post(endpoint, payload, {
      responseType: 'blob',
    });
  }

  updateAddressContract(
    contractId: string,
    payload: any,
    pdfFile: File,
    photoFiles: File[]
  ): Observable<any> {
    const formData: FormData = new FormData();

    formData.append('data', JSON.stringify(payload));
    formData.append('files', pdfFile);

    if (photoFiles && photoFiles.length > 0) {
      photoFiles.forEach((photo) => {
        formData.append('files', photo);
      });
    }
    return this.http.patch<any>(
      `${this.urlApi}/contract/${contractId}/update-address`,
      formData
    );
  }

  getContractByRbxCode(clientId: string, codeContractRbx: string) {
    return this.http.get<Contract>(
      `${this.urlApi}/contract/${clientId}/by-code`,
      { params: { codeContractRbx } }
    );
  }

  simulateCancellation(
    contractId: string,
    dataRescisao: Date,
    valorProporcionalCalculador: number,
    numberParcels: number = 1,
    isUpgradeDowngrade: boolean = false
  ): Observable<CancelSimulationDTO> {
    let params = new HttpParams()
      .set('valorProporcional', valorProporcionalCalculador.toString())
      .set('numberParcels', numberParcels.toString())
      .set('isUpgradeDowngrade', isUpgradeDowngrade.toString());

    if (dataRescisao) {
      const dataFormatada = this.dateUtils.formatToISODateString(dataRescisao);

      if (dataFormatada) {
        params = params.set('dataRescisao', dataFormatada);
      }
    }

    return this.http.get<CancelSimulationDTO>(
      `${this.urlApi}/contract/${contractId}/simulation`,
      { params }
    );
  }

  cancelWithDebt(
    contractId: string,
    payload: any,
    pdfFile: File,
    photoFiles: File[]
  ): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('data', JSON.stringify(payload));

    formData.append('files', pdfFile);

    if (photoFiles && photoFiles.length > 0) {
      photoFiles.forEach((photo) => {
        formData.append('files', photo);
      });
    }

    return this.http.post(
      `${this.urlApi}/contract/${contractId}/cancel`,
      formData
    );
  }

  cancelNoDebt(
    contractId: string,
    payload: any,
    pdfFile: File,
    photoFiles: File[]
  ): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('data', JSON.stringify(payload));

    formData.append('files', pdfFile);

    if (photoFiles && photoFiles.length > 0) {
      photoFiles.forEach((photo) => {
        formData.append('files', photo);
      });
    }

    return this.http.post(
      `${this.urlApi}/contract/${contractId}/finalize-no-debt`,
      formData
    );
  }

  getAuthenticationsByContract(
    contractId: string
  ): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.urlApi}/contract/${contractId}/authentications`
    );
  }
}
