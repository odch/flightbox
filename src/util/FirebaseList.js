class FirebaseList {

  constructor(firebaseRef, comparator, limit) {
    this.firebaseRef = firebaseRef;
    this.comparator = comparator;
    this.limit = limit;
    this.results = [];

    this.callbacks = [];

    this.keySearches = [];
    this.childSearches = [];
  }

  addResultCallback(callback) {
    this.callbacks.push(callback);
  }

  removeResultCallback(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  search(terms) {
    if (terms.keyTerm) {
      this.searchForKey(terms.keyTerm);
    } else {
      this.keySearches = [];
    }
    if (terms.childTerms.length > 0) {
      this.searchForChildren(terms.childTerms);
    } else {
      this.childSearches = [];
    }

    if (this.keySearches.length === 0 && this.childSearches.length === 0) {
      this.combineResults();
    }
  }

  searchForKey(keyTerm) {
    const keyTerms = [keyTerm.term];
    keyTerm.prefixes.forEach(prefix => keyTerms.push(prefix + keyTerm.term));

    keyTerms.forEach(term => {
      const existingSearchObj = this.keySearches.find(searchObj => searchObj.term === term);
      if (!existingSearchObj) {
        const searchObj = {
          term,
          completed: false,
          results: [],
        };
        this.keySearches.push(searchObj);
        this.firebaseRef
          .orderByKey()
          .startAt(term)
          .endAt(term + '\uf8ff')
          .limitToFirst(this.limit)
          .once('value', snapshot => {
            if (snapshot.numChildren() > 0) {
              snapshot.forEach(item => {
                searchObj.results.push({
                  key: item.key(),
                  value: item.val(),
                });
              });
            }
            searchObj.completed = true;
            this.combineResults();
          });
      }
    });

    const newKeySearches = [];
    this.keySearches.forEach(search => {
      if (keyTerms.indexOf(search.term) !== -1) {
        newKeySearches.push(search);
      }
    });
    this.keySearches = newKeySearches;
  }

  searchForChildren(childTerms) {
    childTerms.forEach(term => {
      const existingSearchObj = this.childSearches.find(searchObj => searchObj.child === term.child && searchObj.term === term.term);
      if (!existingSearchObj) {
        const searchObj = {
          child: term.child,
          term: term.term,
          completed: false,
          results: [],
        };
        this.childSearches.push(searchObj);
        this.firebaseRef
          .orderByChild(searchObj.child)
          .startAt(searchObj.term)
          .endAt(searchObj.term + '\uf8ff')
          .limitToFirst(this.limit)
          .once('value', snapshot => {
            if (snapshot.numChildren() > 0) {
              snapshot.forEach(item => {
                searchObj.results.push({
                  key: item.key(),
                  value: item.val(),
                });
              });
            }
            searchObj.completed = true;
            this.combineResults();
          });
      }
    });

    const newChildSearches = [];
    this.childSearches.forEach(search => {
      const stillPresent = childTerms.find(childTerm => childTerm.child === search.child && childTerm.term === search.term);
      if (stillPresent) {
        newChildSearches.push(search);
      }
    });
    this.childSearches = newChildSearches;
  }

  combineResults() {
    const combinedResults = [];

    const keySearchesCompleted = this.addResults(combinedResults, this.keySearches);
    const childSearchesCompleted = this.addResults(combinedResults, this.childSearches);

    const limited = combinedResults.slice(0, this.limit);

    limited.sort(this.comparator);

    this.callbacks.forEach(callback => callback({
      data: limited,
      final: keySearchesCompleted && childSearchesCompleted,
    }));
  }

  addResults(results, searches) {
    let allCompleted = true;

    for (let i = 0; i < searches.length; i++) {
      const keySearch = searches[i];
      if (keySearch.completed === true) {
        keySearch.results.forEach(item => {
          const existing = results.find(record => record.key === item.key);
          if (!existing) {
            results.push(item);
          }
        });
      } else {
        allCompleted = false;
      }
    }

    return allCompleted;
  }
}

export default FirebaseList;
