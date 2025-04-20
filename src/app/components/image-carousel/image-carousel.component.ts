import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';

@Component({
  selector: 'app-image-carousel',
  imports: [CommonModule],
  templateUrl: './image-carousel.component.html',
  styleUrl: './image-carousel.component.css'
})
export class ImageCarouselComponent implements AfterViewInit, OnDestroy {
  @Input() images: string[] = [];
  @ViewChild('wrapper') wrapper!: ElementRef;
  activeIndex:number = 0;
  private scrollListener: any;
  private lastScrollLeft = 0;
  private scrollCheckFrame: any = null;
  private touchStartX = 0;

  ngAfterViewInit() {
    this.scrollToIndex(this.activeIndex);

    // Attach scroll event to the wrapper div
    // this.scrollListener = this.onScroll.bind(this);
    this.wrapper.nativeElement.addEventListener('scroll', this.scrollListener);
  }



  left(){
    if(this.activeIndex>0){
      this.scrollToIndex(--this.activeIndex)
    } 
  }
  right(){
    if(this.activeIndex<this.images.length-1){
      this.scrollToIndex(++this.activeIndex)
    }
  }


  scrollToIndex(index:number) {
    const element = document.getElementById('carousel-item-' + index);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  ngOnDestroy() {
    if (this.wrapper) {
      this.wrapper.nativeElement.removeEventListener('scroll', this.scrollListener);
    }
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const swipeDistance = this.touchStartX - touchEndX;
  
    if (swipeDistance > 40) {
      this.right();
    } else if (swipeDistance < -40) {
      this.left();
    } else {
      this.snapToNearestItem(); // if swipe is small
    }
  }


  // onScroll() {
  //   if (this.scrollCheckFrame) cancelAnimationFrame(this.scrollCheckFrame);
  //     this.detectScrollEnd();
  // }

  // detectScrollEnd() {
  //   const wrapperEl = this.wrapper.nativeElement;
  
  //   this.scrollCheckFrame = requestAnimationFrame(() => {
  //     const currentScroll = wrapperEl.scrollLeft;
  
  //     if (currentScroll !== this.lastScrollLeft) {
  //       // Still scrolling
  //       this.lastScrollLeft = currentScroll;
  //       this.detectScrollEnd();
  //     } else {
  //       // Scroll stopped → Snap to nearest item
  //       const containerWidth = wrapperEl.offsetWidth;
  //       const itemTotalWidth = containerWidth * 0.8 + 16; // 80% + gap
  
  //       const index = Math.round(currentScroll / itemTotalWidth);
  //       this.activeIndex = Math.min(Math.max(index, 0), this.images.length - 1);
  //       this.scrollToIndex(this.activeIndex);
  //     }
  //   });

  // }

  onPointerUp(event: PointerEvent) {
    this.snapToNearestItem();
  }

  private snapToNearestItem() {
    const wrapperEl = this.wrapper.nativeElement;
    const scrollLeft = wrapperEl.scrollLeft;
    const itemTotalWidth = wrapperEl.offsetWidth * 0.8 + 16;
  
    const index = Math.round(scrollLeft / itemTotalWidth);
    this.activeIndex = Math.min(Math.max(index, 0), this.images.length - 1);
    this.scrollToIndex(this.activeIndex);
  }
}
