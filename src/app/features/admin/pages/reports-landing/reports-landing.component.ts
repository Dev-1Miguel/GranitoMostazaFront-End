import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatingHomeButtonComponent } from '../../../../shared/components/floating-home-button/floating-home-button.component';
import { Product } from '../../../../shared/models/product.interfaces';
import { MenuDataService } from '../../../menu/menu-data.service';

interface AdminNavItem {
  label: string;
  icon: string;
  route?: string;
}

type ReportFilterMode = 'dia' | 'mes' | 'anio';
type SalesChannel = 'Domicilio' | 'Local';

interface ReportSaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface ReportSale {
  id: string;
  customer: string;
  channel: SalesChannel;
  payment: string;
  createdAt: string;
  items: ReportSaleItem[];
  total: number;
}

interface ProductMetric {
  name: string;
  quantity: number;
  percentage: number;
  note: string;
}

interface ProductBarMetric {
  name: string;
  quantity: number;
  percentage: number;
}

@Component({
  selector: 'app-reports-landing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    InputTextModule,
    FloatingHomeButtonComponent
  ],
  templateUrl: './reports-landing.component.html',
  styleUrls: ['./reports-landing.component.css']
})
export class ReportsLandingComponent implements OnInit {
  private readonly menuDataService = inject(MenuDataService);
  private readonly destroyRef = inject(DestroyRef);

  readonly navItems: AdminNavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', route: '/admin' },
    { label: 'Pedidos', icon: 'pi pi-shopping-bag', route: '/admin/pedidos' },
    { label: 'Productos', icon: 'pi pi-box', route: '/admin/productos' },
    { label: 'Reportes', icon: 'pi pi-chart-line', route: '/admin/reportes' }
  ];

  readonly periodOptions: Array<{ key: ReportFilterMode; label: string }> = [
    { key: 'dia', label: 'Dia' },
    { key: 'mes', label: 'Mes' },
    { key: 'anio', label: 'Anio' }
  ];
  readonly rowsPerPageOptions = [5, 10, 20];

  readonly allSales: ReportSale[] = [];
  readonly selectedYearOptions: number[] = [];

  filterMode: ReportFilterMode = 'dia';
  selectedDay = this.toDateInput(new Date());
  selectedMonth = this.toMonthInput(new Date());
  selectedYear = new Date().getFullYear();
  rowsPerPage = 5;
  currentPage = 1;

  ngOnInit(): void {
    this.menuDataService
      .getMenuData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const catalog = [...data.desayunos, ...data.postres, ...data.bebidas];
        const generatedSales = this.buildSales(catalog);
        this.allSales.splice(0, this.allSales.length, ...generatedSales);

        const years = [...new Set(generatedSales.map((sale) => new Date(sale.createdAt).getFullYear()))].sort(
          (a, b) => b - a
        );

        this.selectedYearOptions.splice(0, this.selectedYearOptions.length, ...years);
        this.selectedYear = years[0] ?? this.selectedYear;
      });
  }

  get filteredSales(): ReportSale[] {
    return this.allSales.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      const saleDay = this.toDateInput(saleDate);
      const saleMonth = this.toMonthInput(saleDate);
      const saleYear = saleDate.getFullYear();

      if (this.filterMode === 'dia') {
        return saleDay === this.selectedDay;
      }

      if (this.filterMode === 'mes') {
        return saleMonth === this.selectedMonth;
      }

      return saleYear === this.selectedYear;
    });
  }

  get totalSales(): number {
    return this.filteredSales.length;
  }

  get paginatedSales(): ReportSale[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredSales.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalSales / this.rowsPerPage));
  }

  get visibleRangeLabel(): string {
    if (!this.totalSales) {
      return '0 de 0';
    }

    const start = (this.currentPage - 1) * this.rowsPerPage + 1;
    const end = Math.min(start + this.rowsPerPage - 1, this.totalSales);
    return `${start}-${end} de ${this.totalSales}`;
  }

  get totalRevenue(): number {
    return this.filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  }

  get totalUnitsSold(): number {
    return this.filteredSales.reduce(
      (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );
  }

  get averageTicket(): number {
    return this.totalSales ? this.totalRevenue / this.totalSales : 0;
  }

  get topProduct(): ProductMetric {
    return this.buildProductMetric('top');
  }

  get leastProduct(): ProductMetric {
    return this.buildProductMetric('least');
  }

  get topProductsChart(): ProductBarMetric[] {
    return this.buildProductBars('top');
  }

  get leastProductsChart(): ProductBarMetric[] {
    return this.buildProductBars('least');
  }

  get channelMetrics(): Array<{ label: SalesChannel; count: number; percentage: number; accent: string }> {
    const domicileCount = this.filteredSales.filter((sale) => sale.channel === 'Domicilio').length;
    const localCount = this.filteredSales.filter((sale) => sale.channel === 'Local').length;
    const total = domicileCount + localCount;

    return [
      {
        label: 'Domicilio',
        count: domicileCount,
        percentage: total ? (domicileCount / total) * 100 : 0,
        accent: 'var(--report-accent)'
      },
      {
        label: 'Local',
        count: localCount,
        percentage: total ? (localCount / total) * 100 : 0,
        accent: '#8b2323'
      }
    ];
  }

  get leadingChannel(): string {
    const [domicilio, local] = this.channelMetrics;

    if (domicilio.count === local.count) {
      return 'Hay equilibrio entre domicilio y consumo en local.';
    }

    return domicilio.count > local.count
      ? 'Predominan los pedidos para domicilio.'
      : 'Predominan los pedidos para servir en el local.';
  }

  setFilterMode(mode: ReportFilterMode): void {
    this.filterMode = mode;
    this.resetPagination();
  }

  onPeriodValueChange(): void {
    this.resetPagination();
  }

  onRowsPerPageChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('es-EC', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  getProductsSummary(sale: ReportSale): string {
    return sale.items.map((item) => `${item.quantity}x ${item.productName}`).join(', ');
  }

  downloadReport(): void {
    const workbook = this.buildWorkbookXml();
    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `reporte-ventas-${this.filterMode}-${this.getSelectedPeriodSlug()}.xls`;
    link.click();

    URL.revokeObjectURL(url);
  }

  private buildProductMetric(kind: 'top' | 'least'): ProductMetric {
    const entries = this.getProductEntries();

    if (!entries.length) {
      return {
        name: 'Sin datos',
        quantity: 0,
        percentage: 0,
        note: 'No hay ventas en el periodo seleccionado.'
      };
    }

    const [maxName, maxQty] = entries[0];
    const [minName, minQty] = entries[entries.length - 1];

    if (kind === 'top') {
      return {
        name: maxName,
        quantity: maxQty,
        percentage: 100,
        note: 'Es el producto con mayor salida en el periodo filtrado.'
      };
    }

    return {
      name: minName,
      quantity: minQty,
      percentage: maxQty ? (minQty / maxQty) * 100 : 0,
      note: 'Es el producto con menor movimiento dentro de las ventas visibles.'
    };
  }

  private buildProductBars(kind: 'top' | 'least'): ProductBarMetric[] {
    const entries = this.getProductEntries();

    if (!entries.length) {
      return [{ name: 'Sin datos', quantity: 0, percentage: 0 }];
    }

    const selected =
      kind === 'top'
        ? entries.slice(0, 5)
        : [...entries].reverse().slice(0, 5).sort((a, b) => a[1] - b[1]);

    const maxValue = Math.max(...selected.map(([, quantity]) => quantity), 0);

    return selected.map(([name, quantity]) => ({
      name,
      quantity,
      percentage: maxValue ? (quantity / maxValue) * 100 : 0
    }));
  }

  private buildSales(products: Product[]): ReportSale[] {
    const now = new Date();
    const customers = [
      'Ana Paredes',
      'Carlos Solis',
      'Marta Leon',
      'Luis Vera',
      'Mesa 02',
      'Mesa 04',
      'Mesa 07',
      'Patricia Cedeño',
      'Daniela Mena',
      'Sofia Andrade'
    ];
    const payments = ['Efectivo', 'Tarjeta', 'Transferencia', 'Pago movil'];
    const favorite = products[0] ?? products[1];
    const occasional = products[products.length - 1] ?? products[0];
    const sales: ReportSale[] = [];

    for (let index = 0; index < 180; index += 1) {
      const saleDate = new Date(now);
      const dayOffset = Math.floor(index / 2);

      saleDate.setDate(now.getDate() - dayOffset);
      saleDate.setHours(7 + (index % 10), (index * 17) % 60, 0, 0);

      const baseProduct = products[(index * 3) % products.length] ?? favorite;
      const secondProduct = products[(index * 5 + 7) % products.length] ?? baseProduct;
      const thirdProduct = products[(index * 7 + 11) % products.length] ?? secondProduct;
      const lines: ReportSaleItem[] = [];

      lines.push(this.createSaleItem(baseProduct, (index % 3) + 1));

      if (index % 2 === 0) {
        lines.push(this.createSaleItem(secondProduct, ((index + 1) % 2) + 1));
      }

      if (index % 5 === 0) {
        lines.push(this.createSaleItem(thirdProduct, 1));
      }

      if (index % 3 === 0 && favorite) {
        lines.push(this.createSaleItem(favorite, 2));
      }

      if (index % 37 === 0 && occasional) {
        lines.splice(0, lines.length, this.createSaleItem(occasional, 1));
      }

      const mergedLines = this.mergeRepeatedItems(lines);
      const total = mergedLines.reduce((sum, item) => sum + item.subtotal, 0);

      sales.push({
        id: `V-${(1000 + index).toString()}`,
        customer: customers[index % customers.length],
        channel: index % 4 === 0 || index % 4 === 1 ? 'Domicilio' : 'Local',
        payment: payments[index % payments.length],
        createdAt: saleDate.toISOString(),
        items: mergedLines,
        total
      });
    }

    return sales.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  private createSaleItem(product: Product, quantity: number): ReportSaleItem {
    return {
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.price,
      subtotal: product.price * quantity
    };
  }

  private mergeRepeatedItems(items: ReportSaleItem[]): ReportSaleItem[] {
    const merged = new Map<number, ReportSaleItem>();

    for (const item of items) {
      const current = merged.get(item.productId);

      if (!current) {
        merged.set(item.productId, { ...item });
        continue;
      }

      current.quantity += item.quantity;
      current.subtotal += item.subtotal;
    }

    return [...merged.values()];
  }

  private buildWorkbookXml(): string {
    const summaryRows = [
      ['Periodo', this.getSelectedPeriodLabel()],
      ['Ventas registradas', this.totalSales.toString()],
      ['Ingresos totales', this.totalRevenue.toFixed(2)],
      ['Ticket promedio', this.averageTicket.toFixed(2)],
      ['Producto mas comprado', `${this.topProduct.name} (${this.topProduct.quantity})`],
      ['Producto menos comprado', `${this.leastProduct.name} (${this.leastProduct.quantity})`],
      ['Modalidad predominante', this.leadingChannel]
    ];

    const salesRows = this.filteredSales.map((sale) => [
      sale.id,
      this.formatDateTime(sale.createdAt),
      sale.channel,
      sale.customer,
      sale.payment,
      this.getProductsSummary(sale),
      sale.total.toFixed(2)
    ]);

    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Resumen">
<Table>
${this.buildXmlRows([['Campo', 'Valor'], ...summaryRows])}
</Table>
</Worksheet>
<Worksheet ss:Name="Ventas">
<Table>
${this.buildXmlRows([['Venta', 'Fecha', 'Modalidad', 'Cliente', 'Pago', 'Productos', 'Total'], ...salesRows])}
</Table>
</Worksheet>
</Workbook>`;
  }

  private buildXmlRows(rows: string[][]): string {
    return rows
      .map(
        (cells) =>
          `<Row>${cells
            .map(
              (cell) =>
                `<Cell><Data ss:Type="String">${this.escapeXml(cell)}</Data></Cell>`
            )
            .join('')}</Row>`
      )
      .join('');
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }

  private getSelectedPeriodLabel(): string {
    if (this.filterMode === 'dia') {
      return this.selectedDay;
    }

    if (this.filterMode === 'mes') {
      return this.selectedMonth;
    }

    return this.selectedYear.toString();
  }

  private getSelectedPeriodSlug(): string {
    return this.getSelectedPeriodLabel().replaceAll('/', '-');
  }

  private getProductEntries(): Array<[string, number]> {
    const quantities = new Map<string, number>();

    for (const sale of this.filteredSales) {
      for (const item of sale.items) {
        quantities.set(item.productName, (quantities.get(item.productName) ?? 0) + item.quantity);
      }
    }

    return [...quantities.entries()].sort((a, b) => b[1] - a[1]);
  }

  private resetPagination(): void {
    this.currentPage = 1;
  }

  private toDateInput(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private toMonthInput(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');

    return `${year}-${month}`;
  }
}
