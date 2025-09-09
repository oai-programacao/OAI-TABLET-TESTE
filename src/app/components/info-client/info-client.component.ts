// ANGULAR
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

//COMPONENTS
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";


// PRIMENG
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';


@Component({
  selector: 'app-info-client',
  imports: [CommonModule, CardBaseComponent, DividerModule, AvatarModule, AvatarGroupModule, InputTextModule, DatePickerModule, FormsModule, TextareaModule, ButtonModule],
  templateUrl: './info-client.component.html',
  styleUrl: './info-client.component.scss'
})
export class InfoClientComponent {
  birthday: Date = new Date(1980, 7, 12);
}
