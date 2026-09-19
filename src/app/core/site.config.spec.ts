import { SITE, yearsOfExperience } from './site.config';

describe('site config', () => {
  describe('yearsOfExperience', () => {
    it('counts whole years from the career start date', () => {
      // Career started December 2021.
      expect(yearsOfExperience(new Date(2025, 11, 1))).toBe(4);
      expect(yearsOfExperience(new Date(2026, 0, 1))).toBe(4);
    });

    it('does not count the current year until the anniversary month', () => {
      expect(yearsOfExperience(new Date(2026, 10, 30))).toBe(4); // November
      expect(yearsOfExperience(new Date(2026, 11, 1))).toBe(5); // December
    });

    it('never returns a negative number', () => {
      expect(yearsOfExperience(new Date(2019, 0, 1))).toBe(0);
    });
  });

  it('keeps contact details consistent with the structured data in index.html', () => {
    expect(SITE.email).toBe('himanshu82817@gmail.com');
    expect(SITE.social.github).toContain('github.com');
    expect(SITE.social.linkedin).toContain('linkedin.com');
  });

  it('has no trailing slash on siteUrl, so canonical URLs never double up', () => {
    expect(SITE.siteUrl.endsWith('/')).toBeFalse();
  });
});
