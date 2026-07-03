import { useEffect, useMemo, useRef, useState } from 'react';
import {
  collectAllKeywordsFromItems,
  parseSearchTerms,
} from '../utils/keyword-search-format';
import { siteText } from '../utils/admin-text';
import NotificationIcon from './NotificationIcon';

function isKeywordSelected(search, keyword) {
  const lower = keyword.toLowerCase();
  return parseSearchTerms(search).some((term) => term.toLowerCase() === lower);
}

export default function KeywordFilter({
  items,
  search,
  onSearchChange,
  textPrefix = 'blog.list',
}) {
  const [open, setOpen] = useState(false);
  const [popupSearch, setPopupSearch] = useState('');
  const rootRef = useRef(null);

  const allKeywords = useMemo(
    () => collectAllKeywordsFromItems(items),
    [items],
  );

  const selectedKeywords = useMemo(
    () => allKeywords.filter((keyword) => isKeywordSelected(search, keyword)),
    [allKeywords, search],
  );

  const visibleKeywords = useMemo(() => {
    const query = popupSearch.trim().toLowerCase();
    if (!query) return allKeywords;
    return allKeywords.filter((keyword) => keyword.toLowerCase().includes(query));
  }, [allKeywords, popupSearch]);

  useEffect(() => {
    if (!open) {
      setPopupSearch('');
      return undefined;
    }

    const onDocClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeydown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeydown);
    };
  }, [open]);

  const toggleKeyword = (keyword) => {
    const current = parseSearchTerms(search);
    const lower = keyword.toLowerCase();
    const next = isKeywordSelected(search, keyword)
      ? current.filter((term) => term.toLowerCase() !== lower)
      : [...current, keyword];

    onSearchChange(next.join(', '));
  };

  const clearKeywords = () => {
    onSearchChange('');
  };

  return (
    <div className="blog-list__search-row reveal">
      <div className="blog-list__search">
        <input
          type="search"
          className="blog-list__search-input"
          placeholder={siteText(`${textPrefix}.searchPlaceholder`)}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label={siteText(`${textPrefix}.searchAriaLabel`)}
        />
      </div>

      <div className="blog-keyword-filter" ref={rootRef}>
        <button
          type="button"
          className={`blog-keyword-filter__trigger${open ? ' blog-keyword-filter__trigger--open' : ''}${selectedKeywords.length ? ' blog-keyword-filter__trigger--active' : ''}`}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={siteText(`${textPrefix}.keywordFilterAriaLabel`)}
        >
          <NotificationIcon icon="key" />
        </button>

        <div
          className={`blog-keyword-filter__popup${open ? ' blog-keyword-filter__popup--open' : ''}`}
          role="dialog"
          aria-label={siteText(`${textPrefix}.keywordFilterTitle`)}
          aria-hidden={!open}
        >
          <div className="blog-keyword-filter__popup-head">
            <p className="blog-keyword-filter__title">{siteText(`${textPrefix}.keywordFilterTitle`)}</p>
            {selectedKeywords.length > 0 && (
              <button
                type="button"
                className="blog-keyword-filter__clear"
                onClick={clearKeywords}
              >
                {siteText(`${textPrefix}.keywordFilterClear`)}
              </button>
            )}
          </div>

          {allKeywords.length === 0 ? (
            <p className="blog-keyword-filter__empty">{siteText(`${textPrefix}.keywordFilterEmpty`)}</p>
          ) : (
            <>
              <div className="blog-keyword-filter__popup-search">
                <input
                  type="search"
                  className="blog-keyword-filter__search-input"
                  placeholder={siteText(`${textPrefix}.keywordFilterSearchPlaceholder`)}
                  value={popupSearch}
                  onChange={(event) => setPopupSearch(event.target.value)}
                  aria-label={siteText(`${textPrefix}.keywordFilterSearchAriaLabel`)}
                />
              </div>

              {visibleKeywords.length === 0 ? (
                <p className="blog-keyword-filter__empty">{siteText(`${textPrefix}.keywordFilterNoMatch`)}</p>
              ) : (
                <div className="blog-keyword-filter__chips">
                  {visibleKeywords.map((keyword) => {
                    const selected = isKeywordSelected(search, keyword);
                    return (
                      <button
                        key={keyword}
                        type="button"
                        className={`blog-keyword-filter__chip${selected ? ' blog-keyword-filter__chip--selected' : ''}`}
                        onClick={() => toggleKeyword(keyword)}
                        aria-pressed={selected}
                      >
                        {keyword}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
