import { Component } from '@angular/core';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-catalog-layout',
  imports: [Header, RouterOutlet, Footer],
  templateUrl: './catalog-layout.html',
  styleUrl: './catalog-layout.scss',
})
export class CatalogLayout {}
