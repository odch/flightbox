class SearchTerms {

  constructor() {
    this.childTerms = [];
  }

  key(term, prefixes) {
    this.keyTerm = {
      term,
      prefixes: prefixes || [],
    };
    return this;
  }

  child(child, term) {
    this.childTerms.push({
      child,
      term,
    });
    return this;
  }
}

export default SearchTerms;
