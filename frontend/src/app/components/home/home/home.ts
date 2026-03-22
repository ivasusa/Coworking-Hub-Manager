import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { NoNegativeDirective } from '../../../directives/no-negative.directive';
import { SpaceService } from '../../../services/space.service';
import { Space } from '../../../models/space.model';

type SpaceType = 'open' | 'office' | 'conference';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, RouterLink, NoNegativeDirective],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  totalSpaces = 0;
  top5: Space[] = [];
  cities: string[] = [];
  searchResults: Space[] | null = null;
  searched = false;

  form: FormGroup;
  sortField: 'name' | 'city' = 'name';
  sortDir: 'asc' | 'desc' = 'asc';

  selectedCities: string[] = [];
  selectedType: SpaceType | null = null;
  officeSize: number | null = null;

  constructor(private spaceService: SpaceService, private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({ name: [''], officeSize: [null] });
  }

  ngOnInit(): void {
    this.spaceService.getCount().subscribe((r) => (this.totalSpaces = r.count));
    this.spaceService.getTop5().subscribe((r) => (this.top5 = r));
    this.spaceService.getCities().subscribe((r) => (this.cities = r));
  }

  toggleCity(city: string): void {
    const idx = this.selectedCities.indexOf(city);
    if (idx === -1) this.selectedCities.push(city);
    else this.selectedCities.splice(idx, 1);
  }

  isCitySelected(city: string): boolean {
    return this.selectedCities.includes(city);
  }

  selectType(type: SpaceType): void {
    this.selectedType = this.selectedType === type ? null : type;
    if (this.selectedType !== 'office') this.officeSize = null;
  }

  isTypeDisabled(type: SpaceType): boolean {
    return this.selectedType !== null && this.selectedType !== type;
  }

  search(): void {
    this.searched = true;
    const minDesks = this.selectedType === 'office' && this.form.value.officeSize ? this.form.value.officeSize: undefined;

    this.spaceService
      .search(this.form.value.name, this.selectedCities, this.selectedType ?? undefined, minDesks)
      .subscribe((r) => {
        this.searchResults = r;
        this.applySort();
      });
  }

  goToDetails(spaceId: string): void {
    const queryParams: Record<string, string | number> = {};
    if (this.selectedType) queryParams['elementType'] = this.selectedType;
    if (this.selectedType === 'office' && this.form.value.officeSize) {
      queryParams['minDesks'] = this.form.value.officeSize;
    }
    this.router.navigate(['/spaces', spaceId], { queryParams });
  }

  sortBy(field: 'name' | 'city'): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.applySort();
  }

  private applySort(): void {
    if (!this.searchResults) return;
    this.searchResults = [...this.searchResults].sort((a, b) => {
      const va = a[this.sortField].toLowerCase();
      const vb = b[this.sortField].toLowerCase();
      return this.sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }

  imageUrl(path: string): string {
    if (!path) return 'http://localhost:4000/uploads/profiles/default.png';
    return `http://localhost:4000/${path}`;
  }
}
