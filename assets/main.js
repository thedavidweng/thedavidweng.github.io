const user = "thedavidweng";

const github = (path) =>
  fetch(`https://api.github.com/${path}`).then((res) => (res.ok ? res.json() : Promise.reject(res.status)));

github(`users/${user}/repos?sort=pushed&per_page=100`)
  .then((repos) => {
    const stars = new Map(repos.map((repo) => [repo.name, repo.stargazers_count]));
    for (const row of document.querySelectorAll("[data-repo]")) {
      const count = stars.get(row.dataset.repo);
      if (count !== undefined) row.querySelector(".meta").textContent = count >= 5 ? `${count} stars` : "";
    }
  })
  .catch(() => {});

const query = encodeURIComponent(`author:${user} type:pr is:merged -user:${user}`);
github(`search/issues?q=${query}&per_page=1`)
  .then(({ total_count }) => {
    document.querySelector("[data-prs]").textContent = total_count;
  })
  .catch(() => {});
