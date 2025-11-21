import { NotebookIcon } from "lucide-react";
import { Link } from "react-router";

const ExpenseNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6 max-w-md mx-auto text-center">
      <div className="bg-primary/10 rounded-full p-8">
        <NotebookIcon className="size-10 text-primary" />
      </div>
      <h3 className="text-2xl font-bold">No expenses yet</h3>
      <p className="text-base-content/70">
        Ready to organize your expenses? Add your first expense to get started on your journey.
      </p>
      <Link to="/add-expenses" className="btn btn-primary">
        Add Your First Expense
      </Link>
    </div>
  );
};
export default ExpenseNotFound;