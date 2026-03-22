import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  constructor(public auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }

  get imageUrl(): string {
    const img = this.auth.currentUser?.profileImage;
    if (!img) return 'http://localhost:4000/uploads/profiles/default.png';
    return img.startsWith('http') ? img : `http://localhost:4000/${img}`;
  }
}
